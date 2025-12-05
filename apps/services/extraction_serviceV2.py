import base64
import json
import logging
from io import BytesIO
from typing import Any, Dict, List, Tuple

from pdf2image import convert_from_bytes
from PIL import Image
from flask import Blueprint, request, jsonify
import openai

logger = logging.getLogger(__name__)
blueprint = Blueprint("extractor_api", __name__)

class DocumentExtractionServiceV2:
    def __init__(self, client=None, model: str = "o3-mini-high", max_image_width: int = 1000):
        """
        client: initialized OpenAI client (openai module)
        model: model for vision + extraction
        max_image_width: maximum width to scale images for API requests
        """
        self.client = client or openai
        self.model = model
        self.max_image_width = max_image_width

    def extract_from_file(self, file_bytes: bytes, schema: Dict[str, Any]) -> Dict[str, Any]:
        """
        Extract data from PDF or image using OpenAI Vision.
        """
        # Convert file -> images
        try:
            images = self._convert_file_bytes_to_images_b64(file_bytes)
            if not images:
                logger.warning("No images extracted from file bytes.")
                return self._generate_dummy_data(schema)
        except Exception as e:
            logger.exception("Failed to convert file to images: %s", e)
            return self._generate_dummy_data(schema)

        # Build extraction schema
        extraction_schema = self._build_extraction_schema(schema)

        # Compose a single prompt text
        prompt = self._build_prompt(images, extraction_schema)

        # Call OpenAI
        try:
            response = openai.chat.completions.create(
                  model="gpt-4.1",
                  messages=[
                     {"role": "system", "content": "You are a document extraction engine."},
                     {"role": "user", "content": prompt}
                  ]
            )

            
            raw = response.choices[0].message.content
            extracted = json.loads(raw.strip())
            if raw is None:
                logger.error("OpenAI response content missing. Full response: %s", response)
                return self._generate_dummy_data(schema)

            extracted = json.loads(raw.strip())
            return self._format_extraction_results(extracted, schema)

        except json.JSONDecodeError as e:
            logger.exception("JSON parsing error: %s", e)
            logger.debug("Raw response content: %s", raw)
            return self._generate_dummy_data(schema)

        except Exception as e:
            logger.exception("OpenAI API call failed: %s", e)
            raise  # Rethrow to see the actual error during debugging

    # -------------------------
    # Helpers
    # -------------------------
    def _convert_file_bytes_to_images_b64(self, file_bytes: bytes) -> List[Tuple[str, int, int]]:
        """
        Convert PDF/image -> list of (base64, width, height)
        """
        images_b64 = []

        # Try PDF
        try:
            pages = convert_from_bytes(file_bytes, dpi=200, fmt="png")
            for img in pages:
                img = self._resize_image_if_needed(img)
                buffered = BytesIO()
                img.save(buffered, format="PNG")
                b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
                images_b64.append((b64, img.width, img.height))
            return images_b64
        except Exception as pdf_exc:
            logger.debug("PDF conversion failed: %s. Trying as single image.", pdf_exc)

        # Fallback: single image
        img = Image.open(BytesIO(file_bytes))
        img = self._resize_image_if_needed(img)
        buffered = BytesIO()
        img.save(buffered, format="PNG")
        b64 = base64.b64encode(buffered.getvalue()).decode("utf-8")
        images_b64.append((b64, img.width, img.height))
        return images_b64

    def _resize_image_if_needed(self, img: Image.Image) -> Image.Image:
        """
        Resize image to max width if too large
        """
        if img.width > self.max_image_width:
            ratio = self.max_image_width / img.width
            new_size = (self.max_image_width, int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
        return img

    def _build_prompt(self, images: List[Tuple[str, int, int]], schema: Dict[str, Any]) -> str:
        """
        Build single text prompt with schema, bounding boxes, and images
        """
        prompt = "Extract document data from the following PDF/images.\n"
        prompt += "Return a JSON object exactly matching this schema:\n"
        prompt += json.dumps(schema, indent=2)
        prompt += "\n\n"

        for idx, (b64, width, height) in enumerate(images):
            prompt += f"Page {idx+1} image (base64 PNG, width={width}, height={height}):\n"
            prompt += f"{b64}\n\n"

        prompt += (
            "Important instructions:\n"
            "- Use only the bounding boxes defined in 'position' for each field.\n"
            "- Extract tables exactly with the subfields as defined.\n"
            "- If no table is found inside a bounding box, return an empty array.\n"
            "- Never guess outside the bounding box.\n"
            "- Return ONLY valid JSON."
        )
        return prompt

    def _build_extraction_schema(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        return json.loads(json.dumps(schema))

    def _format_extraction_results(self, extracted: Dict[str, Any], schema: Dict[str, Any]) -> Dict[str, Any]:
        output = {}
        fields = schema.get("fields", [])
        for fld in fields:
            name = fld.get("name")
            ftype = fld.get("type")
            output[name] = extracted.get(name, [] if ftype == "table" else None)
        # include extra keys
        for k, v in extracted.items():
            if k not in output:
                output[k] = v
        return output

    def _generate_dummy_data(self, schema: Dict[str, Any]) -> Dict[str, Any]:
        out = {}
        for fld in schema.get("fields", []):
            name = fld.get("name")
            out[name] = [] if fld.get("type") == "table" else None
        return out
