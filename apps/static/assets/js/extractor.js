/**
 * Extractor Page JavaScript
 * Handles field editing, table management, and theme switching
 */

class ExtractorManager {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTableFieldEvents();
        this.reinitializeEventListeners();
        this.applyThemeStyles();
        this.setupThemeObserver();
    }

    setupEventListeners() {
        // Handle navbar toggle clicks
        const navbarToggles = document.querySelectorAll('#mobile-collapse, #mobile-collapse1, .mobile-menu');
        navbarToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.handleNavbarToggle());
        });

        // Field editor functionality
        document.querySelectorAll('.action-btn, .save-btn, .cancel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleFieldAction(e));
        });

        // Add field button
        const addFieldBtn = document.querySelector('.extractor-add-field-btn');
        if (addFieldBtn) {
            addFieldBtn.addEventListener('click', (e) => this.handleAddField(e));
        }

        // Upload button
        const uploadBtn = document.querySelector('.upload-btn');
        if (uploadBtn) {
            uploadBtn.addEventListener('click', (e) => this.handleUpload(e));
        }

        // Drag and drop functionality
        this.setupDragAndDrop();

        // Extract button
        const extractBtn = document.querySelector('.extractor-bottom-bar .dashboard-btn-primary');
        if (extractBtn) {
            extractBtn.addEventListener('click', (e) => this.handleExtract(e));
        }

        // Setup real-time field editing
        this.setupRealTimeFieldEditing();
    }

    setupDragAndDrop() {
        const uploadCard = document.querySelector('.upload-card');
        if (!uploadCard) return;

        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadCard.addEventListener(eventName, (e) => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight drop area when item is dragged over it
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadCard.addEventListener(eventName, () => {
                uploadCard.classList.add('drag-highlight');
            });
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadCard.addEventListener(eventName, () => {
                uploadCard.classList.remove('drag-highlight');
            });
        });

        // Handle dropped files
        uploadCard.addEventListener('drop', (e) => {
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.processUploadedFile(files[0]);
            }
        });
    }

    setupRealTimeFieldEditing() {
        // Add event listeners for real-time field name updates
        document.querySelectorAll('.field-name-input').forEach(input => {
            input.addEventListener('input', (e) => {
                const field = e.target.closest('.extractor-field-row');
                const fieldNameSpan = field.querySelector('.field-name');
                if (fieldNameSpan) {
                    fieldNameSpan.textContent = e.target.value || 'unnamed_field';
                }
            });
        });

        // Add event listeners for real-time field description updates
        document.querySelectorAll('.field-desc-input').forEach(textarea => {
            textarea.addEventListener('input', (e) => {
                const field = e.target.closest('.extractor-field-row');
                const fieldDescDiv = field.querySelector('.field-description');
                if (fieldDescDiv) {
                    fieldDescDiv.textContent = e.target.value || 'No description provided';
                }
            });
        });
    }

    handleNavbarToggle() {
        const mainRow = document.querySelector('.extractor-main-row');
        // Auto-adjust based on navbar state if needed
    }

    handleFieldAction(e) {
        e.preventDefault();
        const btn = e.target.closest('button');
        const action = btn.dataset.action;
        const idx = btn.dataset.idx;
        const field = document.getElementById(`field-${idx}`);
        const editor = document.getElementById(`editor-${idx}`);

        if (!field || !editor) return;

        switch (action) {
            case 'edit':
                this.editField(field, editor);
                break;
            case 'save':
                this.saveField(field, editor, idx);
                break;
            case 'cancel':
                this.cancelEdit(field, editor);
                break;
            case 'delete':
                this.deleteField(field, idx);
                break;
        }
    }

    editField(field, editor) {
        this.collapseAllFields();
        field.classList.add('expanded');
        editor.style.display = 'flex';

                // Store original field values for cancel functionality
        const fieldNameInput = editor.querySelector('.field-name-input');
        const fieldDescInput = editor.querySelector('.field-desc-input');
        const fieldTypeSelect = editor.querySelector('.field-type-select');
        
        if (fieldNameInput) fieldNameInput.dataset.originalValue = fieldNameInput.value;
        if (fieldDescInput) fieldDescInput.dataset.originalValue = fieldDescInput.value;
        if (fieldTypeSelect) fieldTypeSelect.dataset.originalValue = fieldTypeSelect.value;

        // Store original table column values if this is a table field
        const tableColumns = editor.querySelectorAll('.table-column-row');
        tableColumns.forEach(columnRow => {
            const nameInput = columnRow.querySelector('.column-name-input');
            const descInput = columnRow.querySelector('.column-description-input');
            const typeSelect = columnRow.querySelector('.column-type-select');
            
            if (nameInput) nameInput.dataset.originalValue = nameInput.value;
            if (descInput) descInput.dataset.originalValue = descInput.value;
            if (typeSelect) typeSelect.dataset.originalValue = typeSelect.value;
        });

        // Store original display values
        const fieldNameSpan = field.querySelector('.field-name');
        const fieldDescDiv = field.querySelector('.field-description');
        const typeBadge = field.querySelector('.field-type-badge');

        if (fieldNameSpan) {
            editor.dataset.originalFieldName = fieldNameSpan.textContent;
        }
        if (fieldDescDiv) {
            editor.dataset.originalFieldDesc = fieldDescDiv.textContent;
        }
        if (typeBadge) {
            editor.dataset.originalFieldType = typeBadge.textContent;
            editor.dataset.originalFieldTypeClass = typeBadge.className;
        }
    }

    saveField(field, editor, idx) {
        // Update field display with the edited values
        this.updateFieldDisplay(field, editor);
        
        field.classList.remove('expanded');
        editor.style.display = 'none';

        // If this is a table field, ensure subfields are visible and synced
        const fieldTypeSelect = editor.querySelector('.field-type-select');
        const tableSubfields = field.querySelector('.table-subfields');

        if (fieldTypeSelect?.value === 'table' && tableSubfields) {
            tableSubfields.style.display = 'block';
            field.classList.add('table-field');

            // Sync configuration columns to display elements
            this.syncTableConfigurationToDisplay(field, editor);
        }

        console.log('Saving field:', idx);
    }

    syncTableConfigurationToDisplay(field, editor) {
        const tableColumns = editor.querySelectorAll('.table-column-row');
        const subfieldsContainer = field.querySelector('.subfields-container');
        const addSubfieldBtn = subfieldsContainer?.querySelector('.add-subfield-btn');
        
        if (!subfieldsContainer || !addSubfieldBtn) return;

        // Clear existing subfield wrappers (except the add button)
        const existingWrappers = subfieldsContainer.querySelectorAll('.subfield-wrapper');
        existingWrappers.forEach(wrapper => wrapper.remove());

        // Create display elements for each configuration row
        tableColumns.forEach((columnRow, index) => {
            const nameInput = columnRow.querySelector('.column-name-input');
            const descInput = columnRow.querySelector('.column-description-input');
            const typeSelect = columnRow.querySelector('.column-type-select');

            const name = nameInput?.value || 'new_column';
            const desc = descInput?.value || 'Column description';
            const type = typeSelect?.value || 'text';

            const subfieldHtml = `
                <div class="subfield-wrapper">
                    <div class="subfield-row">
                        <div>
                            <span class="subfield-name">${name}</span>
                            <span class="subfield-type ${type}">${type}</span>
                        </div>
                        <button class="column-delete-btn delete-subfield-btn" data-subfield="${name}" title="Remove Column">×</button>
                    </div>
                    <div class="subfield-description">${desc}</div>
                </div>
            `;

            addSubfieldBtn.insertAdjacentHTML('beforebegin', subfieldHtml);
        });

        // Add event listeners to the new delete buttons
        const newDeleteBtns = subfieldsContainer.querySelectorAll('.delete-subfield-btn');
        newDeleteBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteSubfield(e));
        });

        // Update the remove column buttons in configuration to use the full remove handler
        tableColumns.forEach(columnRow => {
            const removeBtn = columnRow.querySelector('.remove-column-btn');
            if (removeBtn) {
                // Remove old event listener and add new one
                const newBtn = removeBtn.cloneNode(true);
                removeBtn.parentNode.replaceChild(newBtn, removeBtn);
                newBtn.addEventListener('click', (e) => this.handleRemoveColumn(e));
            }
        });

        this.applyThemeStyles();
    }

    updateFieldDisplay(field, editor) {
        // Update field name
        const nameInput = editor.querySelector('.field-name-input');
        const fieldNameSpan = field.querySelector('.field-name');
        if (nameInput && fieldNameSpan) {
            fieldNameSpan.textContent = nameInput.value || 'unnamed_field';
        }

        // Update field description
        const descInput = editor.querySelector('.field-desc-input');
        const fieldDescDiv = field.querySelector('.field-description');
        if (descInput && fieldDescDiv) {
            fieldDescDiv.textContent = descInput.value || 'No description provided';
        }

        // Update field type badge
        const typeSelect = editor.querySelector('.field-type-select');
        const typeBadge = field.querySelector('.field-type-badge');
        if (typeSelect && typeBadge) {
            const newType = typeSelect.value;
            typeBadge.textContent = newType;
            typeBadge.className = `field-type-badge ${newType}`;
            
            // Update field row class for table fields
            if (newType === 'table') {
                field.classList.add('table-field');
            } else {
                field.classList.remove('table-field');
            }
        }

        // Apply theme styles to the updated elements
        this.applyThemeStyles();
    }

    cancelEdit(field, editor) {
        // Restore original input values
        const nameInput = editor.querySelector('.field-name-input');
        const descInput = editor.querySelector('.field-desc-input');
        const typeSelect = editor.querySelector('.field-type-select');

        if (nameInput && nameInput.dataset.originalValue !== undefined) {
            nameInput.value = nameInput.dataset.originalValue;
        }
        if (descInput && descInput.dataset.originalValue !== undefined) {
            descInput.value = descInput.dataset.originalValue;
        }
        if (typeSelect && typeSelect.dataset.originalValue !== undefined) {
            typeSelect.value = typeSelect.dataset.originalValue;
        }

        // Restore original display values
        const fieldNameSpan = field.querySelector('.field-name');
        const fieldDescDiv = field.querySelector('.field-description');
        const typeBadge = field.querySelector('.field-type-badge');

        if (fieldNameSpan && editor.dataset.originalFieldName !== undefined) {
            fieldNameSpan.textContent = editor.dataset.originalFieldName;
        }
        if (fieldDescDiv && editor.dataset.originalFieldDesc !== undefined) {
            fieldDescDiv.textContent = editor.dataset.originalFieldDesc;
        }
        if (typeBadge && editor.dataset.originalFieldType !== undefined) {
            typeBadge.textContent = editor.dataset.originalFieldType;
            if (editor.dataset.originalFieldTypeClass !== undefined) {
                typeBadge.className = editor.dataset.originalFieldTypeClass;
            }
        }

        // Restore field row class for table fields
        const originalType = editor.dataset.originalFieldType;
        if (originalType === 'table') {
            field.classList.add('table-field');
        } else {
            field.classList.remove('table-field');
        }

        // Restore original table column values if this is a table field
        const tableColumns = editor.querySelectorAll('.table-column-row');
        tableColumns.forEach((columnRow, index) => {
            const nameInput = columnRow.querySelector('.column-name-input');
            const descInput = columnRow.querySelector('.column-description-input');
            const typeSelect = columnRow.querySelector('.column-type-select');
            
            if (nameInput && nameInput.dataset.originalValue !== undefined) {
                nameInput.value = nameInput.dataset.originalValue;
            }
            if (descInput && descInput.dataset.originalValue !== undefined) {
                descInput.value = descInput.dataset.originalValue;
            }
            if (typeSelect && typeSelect.dataset.originalValue !== undefined) {
                typeSelect.value = typeSelect.dataset.originalValue;
            }
        });

        // Remove any newly added table columns that weren't saved
        // (columns without originalValue data are newly added during this edit session)
        const newlyAddedColumns = Array.from(tableColumns).filter(columnRow => {
            const nameInput = columnRow.querySelector('.column-name-input');
            return nameInput && nameInput.dataset.originalValue === undefined;
        });
        newlyAddedColumns.forEach(columnRow => columnRow.remove());

        // Update the table display to reflect the restored values
        if (originalType === 'table') {
            const remainingColumns = editor.querySelectorAll('.table-column-row');
            remainingColumns.forEach((columnRow, index) => {
                const subfieldsContainer = field.querySelector('.table-subfields');
                if (subfieldsContainer) {
                    const subfieldWrappers = subfieldsContainer.querySelectorAll('.subfield-wrapper');
                    const targetWrapper = subfieldWrappers[index];
                    if (targetWrapper) {
                        this.syncSubfieldDisplay(columnRow, targetWrapper);
                    }
                }
            });
        }

        // Hide table subfields if type changed back from table
        const tableSubfields = field.querySelector('.table-subfields');
        if (tableSubfields && originalType !== 'table') {
            tableSubfields.style.display = 'none';
        } else if (tableSubfields && originalType === 'table') {
            tableSubfields.style.display = 'block';
        }

        field.classList.remove('expanded');
        editor.style.display = 'none';
    }

    deleteField(field, idx) {
        if (confirm('Delete this field?')) {
            field.remove();
            console.log('Deleted field:', idx);
        }
    }

    handleAddField(e) {
        e.preventDefault();
        
        // Find the schema container and add button
        const schemaCard = document.querySelector('.extractor-schema-card');
        const addFieldBtn = document.querySelector('.extractor-add-field-btn');
        
        if (!schemaCard || !addFieldBtn) {
            console.error('Schema container or add button not found');
            return;
        }
        
        // Get the next field index
        const existingFields = document.querySelectorAll('.extractor-field-row');
        const nextIndex = existingFields.length + 1;
        
        // Create new field HTML
        const newFieldHtml = this.createNewFieldHtml(nextIndex);
        
        // Insert before the add button
        addFieldBtn.insertAdjacentHTML('beforebegin', newFieldHtml);
        
        // Setup event listeners for the new field only
        const newField = document.getElementById(`field-${nextIndex}`);
        const newEditor = document.getElementById(`editor-${nextIndex}`);
        
        if (newField && newEditor) {
            // Add event listeners to the new field's buttons only
            newField.querySelectorAll('.action-btn, .save-btn, .cancel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleFieldAction(e));
            });
            
            // Add event listeners to the new field's select and inputs for real-time editing
            const nameInput = newEditor.querySelector('.field-name-input');
            const descInput = newEditor.querySelector('.field-desc-input');
            
            if (nameInput) {
                nameInput.addEventListener('input', (e) => {
                    const fieldNameSpan = newField.querySelector('.field-name');
                    if (fieldNameSpan) {
                        fieldNameSpan.textContent = e.target.value || 'unnamed_field';
                    }
                });
            }
            
            if (descInput) {
                descInput.addEventListener('input', (e) => {
                    const fieldDescDiv = newField.querySelector('.field-description');
                    if (fieldDescDiv) {
                        fieldDescDiv.textContent = e.target.value || 'No description';
                    }
                });
            }
            
            // Setup table field events for the new field
            this.setupTableFieldEventsForElement(newEditor);
            this.applyThemeStyles();
            
            // Auto-open the edit mode for the new field
            setTimeout(() => {
                this.editField(newField, newEditor);
                // Focus on the field name input
                const nameInput = newEditor.querySelector('.field-name-input');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }, 100);
        }
        
        console.log('Added new field with index:', nextIndex);
    }

    createNewFieldHtml(index) {
        return `
            <div class="extractor-field-row" id="field-${index}">
                <div class="field-header">
                    <div>
                        <span class="field-name">new_field_${index}</span>
                        <span class="field-type-badge text">text</span>
                    </div>
                    <div class="field-actions">
                        <button class="action-btn edit-btn" data-idx="${index}" data-action="edit" title="Edit Field">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M12 20h9"/>
                                <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/>
                            </svg>
                        </button>
                        <button class="action-btn delete delete-btn" data-idx="${index}" data-action="delete" title="Delete Field">
                            <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M3 6h18"/>
                                <path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/>
                                <path d="M10 11v6"/>
                                <path d="M14 11v6"/>
                                <path d="M5 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <div class="field-description">Description for new field ${index}</div>
                
                <!-- Field Editor (Hidden by default) -->
                <div class="field-editor" id="editor-${index}">
                    <div class="row">
                        <div class="col-md-6">
                            <label class="field-label">Field Type</label>
                            <select class="form-control field-type-select">
                                <option value="text" selected>Text</option>
                                <option value="number">Number</option>
                                <option value="date">Date</option>
                                <option value="boolean">Boolean</option>
                                <option value="table">Table</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="field-label">Field Name</label>
                            <input type="text" class="form-control field-name-input" value="new_field_${index}">
                        </div>
                    </div>
                    <div>
                        <label class="field-label">Field Description</label>
                        <textarea class="form-control field-desc-input" rows="3">Description for new field ${index}</textarea>
                    </div>
                    
                    <!-- Table Field Configuration -->
                    <div class="table-config" style="display:none;">
                        <label class="table-config-title">Table Columns Configuration</label>
                        <div class="table-columns">
                        </div>
                        <button type="button" class="add-column-btn">+ Add Column</button>
                    </div>
                    
                    <div class="editor-actions table-action-buttons">
                        <button class="table-save-btn save-btn" data-idx="${index}" data-action="save">Save</button>
                        <button class="table-cancel-btn cancel-btn" data-idx="${index}" data-action="cancel">Cancel</button>
                    </div>
                </div>
            </div>
        `;
    }

    handleUpload(e) {
        e.preventDefault();
        console.log('Upload button clicked');
        
        // Create file input element
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.pdf,.png,.jpg,.jpeg';
        fileInput.multiple = false;
        
        // Handle file selection
        fileInput.addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                console.log('File selected from input:', file.name);
                this.processUploadedFile(file);
            }
        });
        
        // Trigger file picker
        fileInput.click();
    }

    processUploadedFile(file) {
        console.log('Processing uploaded file:', file.name);
        
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            alert('File size exceeds 10MB limit. Please choose a smaller file.');
            return;
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            alert('Please select a PDF, PNG, or JPG file.');
            return;
        }

        console.log('File validation passed, updating display...');
        
        // Update UI to show selected file
        this.updateUploadDisplay(file);
        
        // Store the file for extraction
        this.selectedFile = file;
        
        console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }

    updateUploadDisplay(file) {
        console.log('Updating upload display for file:', file.name);
        
        const uploadCard = document.querySelector('.upload-card');
        const documentPreview = document.querySelector('.document-preview-container');
        
        if (!uploadCard || !documentPreview) {
            console.error('Upload card or document preview container not found');
            return;
        }
        
        // Hide upload card and show document preview
        uploadCard.style.display = 'none';
        documentPreview.style.display = 'flex';
        
        // Update document header info
        const documentName = documentPreview.querySelector('.document-name');
        const documentSize = documentPreview.querySelector('.document-size');
        
        if (documentName) documentName.textContent = file.name;
        if (documentSize) documentSize.textContent = this.formatFileSize(file.size);
        
        // Add event listeners for header buttons
        const uploadBtn = documentPreview.querySelector('.upload-btn');
        const removeBtn = documentPreview.querySelector('.remove-file-btn');
        
        if (uploadBtn) {
            // Remove any existing event listeners to prevent multiple firing
            uploadBtn.replaceWith(uploadBtn.cloneNode(true));
            const newUploadBtn = documentPreview.querySelector('.upload-btn');
            newUploadBtn.addEventListener('click', (e) => this.handleUpload(e));
        }
        if (removeBtn) {
            // Remove any existing event listeners
            removeBtn.replaceWith(removeBtn.cloneNode(true));
            const newRemoveBtn = documentPreview.querySelector('.remove-file-btn');
            newRemoveBtn.addEventListener('click', (e) => this.handleRemoveFile(e));
        }
        
        // Render the document content
        this.renderDocumentContent(file);
        
        console.log('Document preview updated successfully');
    }

    renderDocumentContent(file) {
        console.log('Rendering document content for:', file.name, 'Type:', file.type);
        
        const documentContent = document.querySelector('.document-content');
        if (!documentContent) {
            console.error('Document content container not found');
            return;
        }
        
        // Clear existing content
        documentContent.innerHTML = '<div class="loading-preview">Loading document...</div>';
        
        if (file.type === 'application/pdf') {
            this.renderPDFWithCanvas(documentContent, file);
        } else if (file.type.startsWith('image/')) {
            this.renderImageContent(documentContent, file);
        } else {
            documentContent.innerHTML = '<div class="unsupported-file">Preview not available for this file type</div>';
        }
    }

    renderPDFWithCanvas(container, file) {
        console.log('Rendering PDF with Canvas');
        
        // Create file URL for PDF.js
        const fileURL = URL.createObjectURL(file);
        
        // Load PDF.js library if not already loaded
        if (typeof pdfjsLib === 'undefined') {
            // Load PDF.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
            script.onload = () => {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
                this.loadAndRenderPDF(fileURL, container);
            };
            script.onerror = () => {
                console.error('Failed to load PDF.js');
                container.innerHTML = '<div class="pdf-error">Failed to load PDF viewer</div>';
            };
            document.head.appendChild(script);
        } else {
            this.loadAndRenderPDF(fileURL, container);
        }
    }

    async loadAndRenderPDF(fileURL, container) {
        try {
            console.log('Loading PDF...');
            const pdf = await pdfjsLib.getDocument(fileURL).promise;
            console.log(`PDF loaded. Number of pages: ${pdf.numPages}`);

            // Clear loading message
            container.innerHTML = '';

            // Create canvas container for all pages
            const pagesContainer = document.createElement('div');
            pagesContainer.className = 'pdf-pages-container';
            container.appendChild(pagesContainer);

            // Render all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                await this.renderPDFPage(pdf, pageNum, pagesContainer);
            }

            // Clean up the object URL
            URL.revokeObjectURL(fileURL);
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            container.innerHTML = `
                <div class="pdf-error">
                    <p>Error loading PDF: ${error.message}</p>
                </div>
            `;
        }
    }

    async renderPDFPage(pdf, pageNum, container) {
        try {
            const page = await pdf.getPage(pageNum);
            
            // Create canvas for this page
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Get device pixel ratio for high-DPI displays
            const devicePixelRatio = window.devicePixelRatio || 1;
            
            // Calculate scale for full width display with minimal padding
            const containerWidth = container.clientWidth || 600;
            const viewport = page.getViewport({ scale: 1 });
            
            // Scale to fill container width with just 20px total padding (10px each side)
            const displayScale = Math.min((containerWidth - 20) / viewport.width, 3); 
            // Render at much higher quality (3x the display scale) for crisp detail
            const renderScale = displayScale * 3 * devicePixelRatio; 
            
            const scaledViewport = page.getViewport({ scale: renderScale });

            // Set canvas dimensions (high resolution)
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            
            // Set display dimensions (scaled down for smaller, crisp display)
            const displayWidth = (viewport.width * displayScale);
            const displayHeight = (viewport.height * displayScale);
            
            canvas.style.width = displayWidth + 'px';
            canvas.style.height = displayHeight + 'px';
            canvas.style.maxWidth = '100%';
            canvas.style.display = 'block';
            canvas.style.border = '1px solid #e2e8f0';
            canvas.style.borderRadius = '8px';
            canvas.className = 'pdf-page';
            
            // Improve canvas rendering quality
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            // Additional quality settings for crisp text
            if (ctx.textRenderingOptimization) {
                ctx.textRenderingOptimization = 'optimizeQuality';
            }
            
            // Add canvas to container
            container.appendChild(canvas);

            // Render page
            const renderContext = {
                canvasContext: ctx,
                viewport: scaledViewport
            };
            
            await page.render(renderContext).promise;
            console.log(`Page ${pageNum} rendered successfully`);
            
        } catch (error) {
            console.error(`Error rendering page ${pageNum}:`, error);
        }
    }

    renderImageContent(container, file) {
        console.log('Rendering image content');
        
        const fileURL = URL.createObjectURL(file);
        
        // Clear loading message
        container.innerHTML = '';
        
        const img = document.createElement('img');
        img.src = fileURL;
        img.style.width = '100%';
        img.style.height = 'auto';
        img.style.display = 'block';
        img.style.borderRadius = '8px';
        img.style.border = '1px solid #e2e8f0';
        img.className = 'document-image';
        
        img.onload = () => {
            URL.revokeObjectURL(fileURL);
            console.log('Image loaded successfully');
        };
        
        img.onerror = () => {
            console.error('Error loading image');
            container.innerHTML = `
                <div class="image-error">
                    <p>Error loading image</p>
                </div>
            `;
            URL.revokeObjectURL(fileURL);
        };
        
        container.appendChild(img);
    }

    createDocumentPreviewContainer() {
        const uploadPanel = document.querySelector('.extractor-upload-panel');
        
        const previewContainer = document.createElement('div');
        previewContainer.className = 'document-preview';
        previewContainer.innerHTML = `
            <div class="dashboard-card preview-card">
                <div class="preview-header">
                    <div class="preview-title">Document Preview</div>
                    <button class="preview-toggle-btn" title="Toggle Preview">
                        <svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M6 9l6 0"/>
                        </svg>
                    </button>
                </div>
                <div class="preview-content">
                    <!-- Document content will be rendered here -->
                </div>
            </div>
        `;
        
        // Insert after upload card
        uploadPanel.appendChild(previewContainer);
        
        // Add toggle functionality
        const toggleBtn = previewContainer.querySelector('.preview-toggle-btn');
        const previewContent = previewContainer.querySelector('.preview-content');
        
        toggleBtn.addEventListener('click', () => {
            const isCollapsed = previewContent.style.display === 'none';
            previewContent.style.display = isCollapsed ? 'block' : 'none';
            toggleBtn.innerHTML = isCollapsed ? 
                '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 0"/></svg>' :
                '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 6l-6 6-6-6"/></svg>';
        });
        
        return previewContainer;
    }

    renderPDFContent(container, fileURL, fileName) {
        console.log('Rendering PDF content');
        
        container.innerHTML = `
            <div class="pdf-viewer">
                <div class="pdf-controls">
                    <button class="pdf-control-btn" id="pdf-prev">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M15 18l-6-6 6-6"/>
                        </svg>
                        Previous
                    </button>
                    <span class="pdf-page-info">
                        Page <span id="pdf-current-page">1</span> of <span id="pdf-total-pages">-</span>
                    </span>
                    <button class="pdf-control-btn" id="pdf-next">
                        Next
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M9 18l6-6-6-6"/>
                        </svg>
                    </button>
                </div>
                <div class="pdf-container">
                    <embed src="${fileURL}" type="application/pdf" width="100%" height="600px">
                    <div class="pdf-fallback">
                        <p>Your browser doesn't support PDF preview.</p>
                        <a href="${fileURL}" target="_blank" class="dashboard-btn dashboard-btn-outline">
                            Open PDF in new tab
                        </a>
                    </div>
                </div>
            </div>
        `;
    }

    handleRemoveFile(e) {
        e.preventDefault();
        
        // Clear the selected file
        this.selectedFile = null;
        
        // Reset the upload display
        this.resetUploadDisplay();
        
        // Clear document content
        const documentContent = document.querySelector('.document-content');
        if (documentContent) {
            documentContent.innerHTML = '';
        }
        
        // Hide document preview container
        const documentPreview = document.querySelector('.document-preview-container');
        if (documentPreview) {
            documentPreview.style.display = 'none';
        }
        
        // Show upload card
        const uploadCard = document.querySelector('.upload-card');
        if (uploadCard) {
            uploadCard.style.display = 'block';
        }
    }

    resetUploadDisplay() {
        const uploadCard = document.querySelector('.upload-card');
        const cardBody = uploadCard.querySelector('.card-body');
        
        // Reset to original upload UI
        cardBody.innerHTML = `
            <div class="upload-icon">
                <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 8l-4-4m0 0L8 8m4-4v12"/>
                </svg>
            </div>
            <div class="dashboard-card-title">Upload Document</div>
            <div class="dashboard-card-text">Drag and drop your file here</div>
            <button class="dashboard-btn dashboard-btn-primary upload-btn">Select File</button>
            <div class="dashboard-card-text" style="font-size:0.98rem;color:#888;margin-bottom:0;">PDF, PNG, JPG up to 10MB</div>
        `;
        
        // Re-add event listener for the upload button
        const uploadBtn = cardBody.querySelector('.upload-btn');
        uploadBtn.addEventListener('click', (e) => this.handleUpload(e));
        
        // Re-setup drag and drop
        this.setupDragAndDrop();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    handleExtract(e) {
        e.preventDefault();
        
        // Check if a file is selected
        if (!this.selectedFile) {
            alert('Please select a file first.');
            return;
        }

        // Get the current schema configuration
        const schemaConfig = this.getCurrentSchemaConfig();
        
        // Show loading state
        this.showExtractionLoading();
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('schema', JSON.stringify(schemaConfig));
        
        // Send extraction request
        fetch('/api/extract', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            this.hideExtractionLoading();
            if (data.success) {
                this.renderExtractionResults(data.results);
            } else {
                alert('Extraction failed: ' + (data.error || 'Unknown error'));
            }
        })
        .catch(error => {
            this.hideExtractionLoading();
            console.error('Extraction error:', error);
            alert('Extraction failed. Please try again.');
        });
    }

    getCurrentSchemaConfig() {
        const fields = [];
        
        // Get all field rows
        document.querySelectorAll('.extractor-field-row').forEach((fieldRow, index) => {
            const fieldName = fieldRow.querySelector('.field-name').textContent.trim();
            const fieldType = fieldRow.querySelector('.field-type-badge').textContent.trim();
            const fieldDesc = fieldRow.querySelector('.field-description').textContent.trim();
            
            const field = {
                name: fieldName,
                type: fieldType,
                description: fieldDesc
            };
            
            // Handle table fields with subfields
            if (fieldType === 'table') {
                const subfields = [];
                fieldRow.querySelectorAll('.subfield-wrapper').forEach(subfieldWrapper => {
                    const subfieldName = subfieldWrapper.querySelector('.subfield-name').textContent.trim();
                    const subfieldType = subfieldWrapper.querySelector('.subfield-type').textContent.trim();
                    const subfieldDesc = subfieldWrapper.querySelector('.subfield-description').textContent.trim();
                    
                    subfields.push({
                        name: subfieldName,
                        type: subfieldType,
                        description: subfieldDesc
                    });
                });
                field.subfields = subfields;
            }
            
            fields.push(field);
        });
        
        return { fields };
    }

    showExtractionLoading() {
        const extractBtn = document.querySelector('.extractor-bottom-bar .dashboard-btn-primary');
        extractBtn.disabled = true;
        extractBtn.innerHTML = `
            <svg class="animate-spin" width="16" height="16" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Processing...
        `;
    }

    hideExtractionLoading() {
        const extractBtn = document.querySelector('.extractor-bottom-bar .dashboard-btn-primary');
        extractBtn.disabled = false;
        extractBtn.innerHTML = 'Extract Document';
    }

    renderExtractionResults(results) {
        // Create results panel
        const resultsPanel = this.createResultsPanel(results);
        
        // Insert results panel after the schema panel
        const schemaPanel = document.querySelector('.extractor-schema-panel');
        schemaPanel.parentNode.insertBefore(resultsPanel, schemaPanel.nextSibling);
        
        // Scroll to results
        resultsPanel.scrollIntoView({ behavior: 'smooth' });
    }

    createResultsPanel(results) {
        const panel = document.createElement('div');
        panel.className = 'extractor-results-panel';
        panel.innerHTML = `
            <div class="dashboard-card extractor-results-card">
                <div class="dashboard-title results-title">
                    Extraction Results
                    <button class="dashboard-btn dashboard-btn-outline download-btn">Download JSON</button>
                </div>
                <div class="results-content">
                    ${this.renderResultsContent(results)}
                </div>
            </div>
        `;
        
        // Add download functionality
        const downloadBtn = panel.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => this.downloadResults(results));
        
        return panel;
    }

    renderResultsContent(results) {
        let html = '';
        
        Object.entries(results).forEach(([fieldName, value]) => {
            html += `
                <div class="result-field">
                    <div class="result-field-header">
                        <strong>${fieldName}:</strong>
                    </div>
                    <div class="result-field-value">
                        ${this.formatResultValue(value)}
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    formatResultValue(value) {
        if (Array.isArray(value)) {
            // Handle table data
            if (value.length === 0) return '<em>No data</em>';
            
            let tableHtml = '<table class="results-table"><thead><tr>';
            
            // Create headers from first row keys
            const headers = Object.keys(value[0] || {});
            headers.forEach(header => {
                tableHtml += `<th>${header}</th>`;
            });
            tableHtml += '</tr></thead><tbody>';
            
            // Add data rows
            value.forEach(row => {
                tableHtml += '<tr>';
                headers.forEach(header => {
                    tableHtml += `<td>${row[header] || ''}</td>`;
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += '</tbody></table>';
            return tableHtml;
        } else if (value === null || value === undefined) {
            return '<em>Not found</em>';
        } else {
            return String(value);
        }
    }

    downloadResults(results) {
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `extraction_results_${new Date().toISOString().slice(0, 10)}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    collapseAllFields() {
        document.querySelectorAll('.extractor-field-row.expanded').forEach(field => {
            field.classList.remove('expanded');
        });
        document.querySelectorAll('.field-editor').forEach(editor => {
            editor.style.display = 'none';
        });
    }

    setupTableFieldEvents() {
        // Field type change handler
        document.querySelectorAll('.field-type-select').forEach(select => {
            select.addEventListener('change', (e) => this.handleFieldTypeChange(e));
        });

        // Add column button handler
        document.querySelectorAll('.add-column-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAddColumn(e));
        });

        // Add subfield button handler
        document.querySelectorAll('.add-subfield-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAddSubfield(e));
        });

        this.setupRemoveColumnEvents();
    }

    setupTableFieldEventsForElement(element) {
        // Field type change handler for specific element
        const typeSelect = element.querySelector('.field-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => this.handleFieldTypeChange(e));
        }

        // Add column button handler for specific element
        const addColumnBtn = element.querySelector('.add-column-btn');
        if (addColumnBtn) {
            addColumnBtn.addEventListener('click', (e) => this.handleAddColumn(e));
        }

        // Add subfield button handler for specific element
        const addSubfieldBtn = element.querySelector('.add-subfield-btn');
        if (addSubfieldBtn) {
            addSubfieldBtn.addEventListener('click', (e) => this.handleAddSubfield(e));
        }

        // Setup remove column events for this element
        element.querySelectorAll('.remove-column-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRemoveColumn(e));
        });
    }

    handleFieldTypeChange(e) {
        const select = e.target;
        const fieldEditor = select.closest('.field-editor');
        const tableConfig = fieldEditor.querySelector('.table-config');
        const fieldRow = select.closest('.extractor-field-row');
        const fieldTypeSpan = fieldRow.querySelector('.field-type-badge');
        const tableSubfields = fieldRow.querySelector('.table-subfields');

        // Only update the display if we're not currently in edit mode
        // We can check this by seeing if the field is expanded
        const isEditing = fieldRow.classList.contains('expanded');
        
        if (!isEditing && fieldTypeSpan) {
            // Update the field type display only when not editing
            this.updateFieldTypeDisplay(fieldTypeSpan, select.value);
        }

        // Show/hide table configuration and subfields based on selection
        if (select.value === 'table') {
            this.showTableConfiguration(tableConfig, tableSubfields, fieldRow);
        } else {
            this.hideTableConfiguration(tableConfig, tableSubfields, fieldRow);
        }
    }

    updateFieldTypeDisplay(span, type) {
        const isDark = document.body.classList.contains('dark');
        const typeColors = this.getTypeColors(type, isDark);
        
        span.style.background = typeColors.background;
        span.style.color = typeColors.color;
        span.textContent = type;
    }

    getTypeColors(type, isDark) {
        const colors = {
            text: {
                light: { background: '#dbeafe', color: '#1e40af' },
                dark: { background: '#1e3a8a', color: '#bfdbfe' }
            },
            number: {
                light: { background: '#dcfce7', color: '#15803d' },
                dark: { background: '#166534', color: '#bbf7d0' }
            },
            date: {
                light: { background: '#f3e8ff', color: '#7c3aed' },
                dark: { background: '#581c87', color: '#e9d5ff' }
            },
            table: {
                light: { background: '#e0e7ff', color: '#4338ca' },
                dark: { background: '#312e81', color: '#c7d2fe' }
            }
        };

        return isDark ? colors[type]?.dark : colors[type]?.light;
    }

    showTableConfiguration(tableConfig, tableSubfields, fieldRow) {
        if (tableConfig) tableConfig.style.display = 'block';
        
        if (!tableSubfields) {
            this.createTableSubfields(fieldRow);
        } else {
            tableSubfields.style.display = 'block';
        }
        
        fieldRow.classList.add('table-field');
    }

    hideTableConfiguration(tableConfig, tableSubfields, fieldRow) {
        if (tableConfig) tableConfig.style.display = 'none';
        if (tableSubfields) {
            tableSubfields.remove();
        }

        // Clear table configuration to prevent old columns from persisting
        const tableColumns = fieldRow.querySelector('.table-columns');
        if (tableColumns) {
            tableColumns.innerHTML = '';
        }

        fieldRow.classList.remove('table-field');
    }

    createTableSubfields(fieldRow) {
        const tableSubfieldsHtml = `
            <div class="table-subfields">
                <div class="table-columns-title">Table Columns:</div>
                <div class="subfields-container">
                    <button class="add-subfield-btn">
                        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M12 5l0 14"/>
                            <path d="M5 12l14 0"/>
                        </svg>
                        Add Table Column
                    </button>
                </div>
            </div>
        `;
        
        fieldRow.querySelector('.field-editor').insertAdjacentHTML('beforebegin', tableSubfieldsHtml);
        this.setupTableFieldEvents();
        this.reinitializeEventListeners();
        this.applyThemeStyles();
    }

    handleAddColumn(e) {
        e.preventDefault();
        const fieldEditor = e.target.closest('.field-editor');
        const tableColumns = fieldEditor.querySelector('.table-columns');
        
        // Only create new column configuration row in edit mode
        // The display element will be created when saving
        const newColumnHtml = this.createColumnConfigHtml();
        tableColumns.insertAdjacentHTML('beforeend', newColumnHtml);
        
        // Add event listeners to the newly created configuration row only
        const newColumnRow = tableColumns.querySelector('.table-column-row:last-child');
        if (newColumnRow) {
            // Add event listener to the remove button
            const removeBtn = newColumnRow.querySelector('.remove-column-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => this.handleRemoveColumnConfig(e));
            }
        }
        
        this.applyThemeStyles();
    }

    handleAddSubfield(e) {
        e.preventDefault();
        const subfieldsContainer = e.target.closest('.subfields-container');
        const fieldRow = e.target.closest('.extractor-field-row');
        const tableColumns = fieldRow.querySelector('.table-columns');

        // Create new display element
        const newSubfieldHtml = this.createSubfieldHtml();
        e.target.insertAdjacentHTML('beforebegin', newSubfieldHtml);

        // Also add configuration row if table-columns exists
        if (tableColumns) {
            const newColumnHtml = this.createColumnConfigHtml();
            tableColumns.insertAdjacentHTML('beforeend', newColumnHtml);
            
            // Add event listeners to the newly created column row
            const newColumnRow = tableColumns.querySelector('.table-column-row:last-child');
            if (newColumnRow) {
                const removeBtn = newColumnRow.querySelector('.remove-column-btn');
                if (removeBtn) {
                    removeBtn.addEventListener('click', (e) => this.handleRemoveColumn(e));
                }
            }
        }

        // Add event listener to the new subfield delete button
        const newSubfieldWrapper = subfieldsContainer.querySelector('.subfield-wrapper:last-of-type');
        if (newSubfieldWrapper) {
            const deleteBtn = newSubfieldWrapper.querySelector('.delete-subfield-btn');
            if (deleteBtn) {
                deleteBtn.addEventListener('click', (e) => this.handleDeleteSubfield(e));
            }
        }

        this.applyThemeStyles();

        // Trigger immediate sync
        setTimeout(() => {
            const newNameInput = tableColumns?.querySelector('.table-column-row:last-child .column-name-input');
            if (newNameInput) {
                this.updateTableDisplay(newNameInput);
            }
        }, 100);
    }

    createSubfieldHtml() {
        return `
            <div class="subfield-wrapper">
                <div class="subfield-row">
                    <div>
                        <span class="subfield-name">new_column</span>
                        <span class="subfield-type text">text</span>
                    </div>
                    <button class="column-delete-btn delete-subfield-btn" data-subfield="new_column" title="Remove Column">×</button>
                </div>
                <div class="subfield-description">New table column description</div>
            </div>
        `;
    }

    createColumnConfigHtml() {
        return `
            <div class="table-column-row">
                <div class="column-input-group">
                    <label class="column-label">Column Name</label>
                    <input type="text" class="form-control column-name-input" value="new_column">
                    <label class="column-label">Description</label>
                    <input type="text" class="form-control column-description-input" value="New table column description" placeholder="Enter column description...">
                </div>
                <div class="column-type-group">
                    <label class="column-label">Type</label>
                    <select class="form-control column-type-select">
                        <option value="text" selected>Text</option>
                        <option value="number">Number</option>
                        <option value="date">Date</option>
                    </select>
                </div>
                <div class="column-actions">
                    <button type="button" class="column-delete-btn remove-column-btn">×</button>
                </div>
            </div>
        `;
    }

    updateTableDisplay(element) {
        const columnRow = element.closest('.table-column-row');
        const fieldRow = element.closest('.extractor-field-row');
        const columnIndex = Array.from(columnRow.parentNode.children).indexOf(columnRow);
        const subfieldsContainer = fieldRow.querySelector('.subfields-container');

        if (subfieldsContainer) {
            const subfieldWrappers = subfieldsContainer.querySelectorAll('.subfield-wrapper');
            const targetWrapper = subfieldWrappers[columnIndex];

            if (targetWrapper) {
                this.syncSubfieldDisplay(columnRow, targetWrapper);
            }
        }
    }

    syncSubfieldDisplay(columnRow, targetWrapper) {
        const nameInput = columnRow.querySelector('.column-name-input');
        const descriptionInput = columnRow.querySelector('.column-description-input');
        const typeSelect = columnRow.querySelector('.column-type-select');
        
        const nameSpan = targetWrapper.querySelector('.subfield-name');
        const descriptionDiv = targetWrapper.querySelector('.subfield-description');
        const typeSpan = targetWrapper.querySelector('.subfield-type');

        if (nameInput && nameSpan) {
            nameSpan.textContent = nameInput.value || 'column_name';
        }

        if (descriptionInput && descriptionDiv) {
            descriptionDiv.textContent = descriptionInput.value || 'Column description';
        }

        if (typeSelect && typeSpan) {
            const type = typeSelect.value;
            typeSpan.textContent = type;
            typeSpan.className = `subfield-type ${type}`;
            
            // Update colors based on current theme
            const isDark = document.body.classList.contains('dark');
            const colors = this.getTypeColors(type, isDark);
            if (colors) {
                typeSpan.style.setProperty('color', colors.color, );
               //  typeSpan.style.background = colors.background;
            }
        }
    }

    setupRemoveColumnEvents() {
        document.querySelectorAll('.remove-column-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRemoveColumn(e));
        });

        document.querySelectorAll('.delete-subfield-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleDeleteSubfield(e));
        });
    }

    handleRemoveColumn(e) {
        e.preventDefault();
        const columnRow = e.target.closest('.table-column-row');
        const fieldRow = e.target.closest('.extractor-field-row');
        const columnIndex = Array.from(columnRow.parentNode.children).indexOf(columnRow);

        // Remove from configuration
        columnRow.remove();

        // Remove corresponding item from display section
        const subfieldsContainer = fieldRow.querySelector('.subfields-container');
        if (subfieldsContainer) {
            const subfieldWrappers = subfieldsContainer.querySelectorAll('.subfield-wrapper');
            if (subfieldWrappers[columnIndex]) {
                subfieldWrappers[columnIndex].remove();
            }
        }
    }

    handleRemoveColumnConfig(e) {
        e.preventDefault();
        // Only remove the configuration row, not the display element
        // This is used when removing columns that haven't been saved yet
        const columnRow = e.target.closest('.table-column-row');
        columnRow.remove();
    }

    handleDeleteSubfield(e) {
        e.preventDefault();
        if (confirm('Remove this table column?')) {
            const subfieldWrapper = e.target.closest('.subfield-wrapper');
            const fieldRow = e.target.closest('.extractor-field-row');
            const subfieldsContainer = fieldRow.querySelector('.subfields-container');
            const subfieldIndex = Array.from(subfieldsContainer.querySelectorAll('.subfield-wrapper')).indexOf(subfieldWrapper);

            // Remove from display
            subfieldWrapper.remove();

            // Remove corresponding configuration row
            const tableColumns = fieldRow.querySelector('.table-columns');
            if (tableColumns) {
                const columnRows = tableColumns.querySelectorAll('.table-column-row');
                if (columnRows[subfieldIndex]) {
                    columnRows[subfieldIndex].remove();
                }
            }
        }
    }

    reinitializeEventListeners() {
        // Remove existing event listeners to prevent duplicates
        const existingButtons = document.querySelectorAll('.remove-column-btn, .add-column-btn, .delete-subfield-btn');
        existingButtons.forEach(btn => {
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });

        // Setup fresh event listeners
        this.setupRemoveColumnEvents();
        
        // Re-setup add column events
        document.querySelectorAll('.add-column-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleAddColumn(e));
        });

        // Re-setup real-time field editing
        this.setupRealTimeFieldEditing();
    }

    applyThemeStyles() {
        const isDark = document.body.classList.contains('dark');

        // Update upload panel card
        const uploadCard = document.querySelector('.upload-card');
        if (uploadCard) {
            uploadCard.style.background = isDark ? '#2C394B' : '#fff';
            uploadCard.style.color = isDark ? '#fff' : '#222';
        }

        // Update main field type spans
        document.querySelectorAll('span[style*="border-radius:12px"]').forEach(span => {
            const text = span.textContent.toLowerCase();
            const colors = this.getTypeColors(text, isDark);
            if (colors) {
               //  span.style.background = colors.background + ' !important';
                span.style.color = colors.color + ' !important';
            }
        });

        // Update subfield type spans
        document.querySelectorAll('.subfield-type').forEach(span => {
            const text = span.textContent.toLowerCase();
            const colors = this.getTypeColors(text, isDark);
            if (colors) {
               //  span.style.background = colors.background + ' !important';
               //  span.style.setProperty('color', colors.color, 'important');
            }
        });
    }

    setupThemeObserver() {
        // Respect user's stored theme preference first
        const currentTheme = localStorage.getItem("theme");
        
        // If user has a stored preference, respect it
        if (currentTheme === "dark") {
            if (!document.body.classList.contains('dark')) {
                document.body.classList.add('dark');
                this.applyThemeStyles();
            }
        } else if (currentTheme === "light") {
            if (document.body.classList.contains('dark')) {
                document.body.classList.remove('dark');
                this.applyThemeStyles();
            }
        }
        // Only use system preference if no user preference is stored
        else if (!currentTheme && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
            if (!document.body.classList.contains('dark')) {
                document.body.classList.add('dark');
                this.applyThemeStyles();
            }
        }

        // Listen for localStorage changes (theme toggle from other pages)
        window.addEventListener('storage', (e) => {
            if (e.key === 'theme') {
                if (e.newValue === 'dark') {
                    document.body.classList.add('dark');
                } else {
                    document.body.classList.remove('dark');
                }
                this.applyThemeStyles();
            }
        });

        // Observe body class changes
        const observer = new MutationObserver(() => {
            this.applyThemeStyles();
        });
        observer.observe(document.body, { attributes: true });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.extractorManager = new ExtractorManager();
});

// Global function for inline event handlers (backward compatibility)
window.updateTableDisplay = function(element) {
    if (window.extractorManager) {
        window.extractorManager.updateTableDisplay(element);
    }
};
