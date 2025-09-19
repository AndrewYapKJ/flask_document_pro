/**
 * Extractor Migration JavaScript
 * Migrates viewport selectio    disableOriginalExtractor() {
        // Prevent the original ExtractorManager file upload from interfering
        console.log('Disabling original ExtractorManager file upload...');
        
        // We don't want to disable the entire ExtractorManager, just its file upload
        // The field editing functionality should remain active
        
        // Remove any existing upload event listeners by cloning buttons
        const existingUploadBtns = document.querySelectorAll('.upload-btn');
        console.log('Found', existingUploadBtns.length, 'upload buttons to override');
        
        existingUploadBtns.forEach((btn, index) => {
            console.log(`Overriding upload button ${index + 1}`);
            // Clone the button to remove all event listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Update our reference to the new buttons
        this.elements.uploadBtn = document.querySelector('.upload-btn');
        console.log('Upload button override complete');
    }functionality
 * Integrates with current application styling and structure
 */

class ExtractorMigration {
    // Add this method to dynamically render schema fields from selections
    renderSchemaFields() {
        const schemaCard = document.querySelector('.extractor-schema-card');
        if (!schemaCard) return;
        // Remove all field rows
        schemaCard.querySelectorAll('.extractor-field-row').forEach(row => row.remove());
        // Add a field row for each selection
        this.state.selections.forEach((sel, idx) => {
            let isEditing = !!sel._editing;
            const fieldRow = document.createElement('div');
            fieldRow.className = 'extractor-field-row';
            fieldRow.style.background = 'rgba(30,32,40,0.98)';
            fieldRow.style.border = '1px solid #2e3440';
            fieldRow.style.borderRadius = '10px';
            fieldRow.style.padding = '18px 20px 10px 20px';
            fieldRow.style.marginBottom = '16px';
            fieldRow.style.boxShadow = '0 0 0 1px #3b4252';

            if (!isEditing) {
                // Header row: name, type badge, actions
                const header = document.createElement('div');
                header.className = 'field-header';
                header.style.display = 'flex';
                header.style.alignItems = 'center';
                header.style.justifyContent = 'space-between';

                // Name/type
                const nameType = document.createElement('div');
                nameType.style.display = 'flex';
                nameType.style.alignItems = 'center';

                // Field name (bold)
                const nameSpan = document.createElement('span');
                nameSpan.className = 'field-name';
                nameSpan.textContent = sel.name || sel.label || `field_${idx+1}`;
                nameSpan.style.fontWeight = 'bold';
                nameSpan.style.fontSize = '1.08rem';
                nameSpan.style.color = '#fff';
                nameSpan.style.marginRight = '12px';
                nameType.appendChild(nameSpan);

                // Type badge
                const typeBadge = document.createElement('span');
                typeBadge.className = 'field-type-badge ' + (sel.type || 'text');
                typeBadge.textContent = sel.type ? sel.type : 'text';
                typeBadge.style.background = '#23262f';
                typeBadge.style.color = '#b4c6e7';
                typeBadge.style.fontSize = '0.92rem';
                typeBadge.style.fontWeight = '500';
                typeBadge.style.borderRadius = '8px';
                typeBadge.style.padding = '2px 10px';
                typeBadge.style.marginLeft = '2px';
                nameType.appendChild(typeBadge);

                header.appendChild(nameType);

                // Actions (edit/delete)
                const actions = document.createElement('div');
                actions.className = 'field-actions';
                actions.style.display = 'flex';
                actions.style.alignItems = 'center';

                // Edit button
                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn edit-btn';
                editBtn.title = 'Edit Field';
                editBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="#60a5fa" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>`;
                editBtn.style.background = 'none';
                editBtn.style.border = 'none';
                editBtn.style.cursor = 'pointer';
                editBtn.style.marginRight = '8px';
                editBtn.addEventListener('click', () => {
                    sel._editing = true;
                    this.renderSchemaFields();
                });
                actions.appendChild(editBtn);

                // Delete button
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-btn delete delete-btn';
                deleteBtn.title = 'Delete Field';
                deleteBtn.innerHTML = `<svg width="18" height="18" fill="none" stroke="#f87171" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M5 6V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2"/></svg>`;
                deleteBtn.style.background = 'none';
                deleteBtn.style.border = 'none';
                deleteBtn.style.cursor = 'pointer';
                deleteBtn.addEventListener('click', () => {
                    this.removeSelection(idx);
                    this.renderSchemaFields();
                });
                actions.appendChild(deleteBtn);

                header.appendChild(actions);
                fieldRow.appendChild(header);

                // Description (below header)
                const descDiv = document.createElement('div');
                descDiv.className = 'field-description';
                descDiv.textContent = sel.desc || '';
                descDiv.style.color = '#b4c6e7';
                descDiv.style.fontSize = '0.98rem';
                descDiv.style.marginTop = '8px';
                fieldRow.appendChild(descDiv);
            } else {
                // Inline editor
                const editor = document.createElement('div');
                editor.className = 'field-editor';
                editor.style.marginTop = '12px';
                editor.style.background = '#23262f';
                editor.style.borderRadius = '8px';
                editor.style.padding = '14px';

                // Name
                const nameLabel = document.createElement('label');
                nameLabel.textContent = 'Field Name';
                nameLabel.className = 'field-label';
                nameLabel.style.display = 'block';
                nameLabel.style.marginBottom = '4px';
                editor.appendChild(nameLabel);
                const nameInput = document.createElement('input');
                nameInput.type = 'text';
                nameInput.value = sel.name || sel.label || `field_${idx+1}`;
                nameInput.className = 'form-control field-name-input';
                nameInput.style.marginBottom = '10px';
                editor.appendChild(nameInput);

                // Type
                const typeLabel = document.createElement('label');
                typeLabel.textContent = 'Field Type';
                typeLabel.className = 'field-label';
                typeLabel.style.display = 'block';
                typeLabel.style.marginBottom = '4px';
                editor.appendChild(typeLabel);
                const typeSelect = document.createElement('select');
                typeSelect.className = 'form-control field-type-select';
                ['text','number','date','boolean'].forEach(type => {
                    const opt = document.createElement('option');
                    opt.value = type;
                    opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
                    if ((sel.type || 'text') === type) opt.selected = true;
                    typeSelect.appendChild(opt);
                });
                typeSelect.style.marginBottom = '10px';
                editor.appendChild(typeSelect);

                // Description
                const descLabel = document.createElement('label');
                descLabel.textContent = 'Field Description';
                descLabel.className = 'field-label';
                descLabel.style.display = 'block';
                descLabel.style.marginBottom = '4px';
                editor.appendChild(descLabel);
                const descInput = document.createElement('textarea');
                descInput.className = 'form-control field-desc-input';
                descInput.rows = 2;
                descInput.value = sel.desc || '';
                editor.appendChild(descInput);

                // Save/Cancel
                const actionsDiv = document.createElement('div');
                actionsDiv.className = 'editor-actions';
                actionsDiv.style.marginTop = '10px';
                const saveBtn = document.createElement('button');
                saveBtn.textContent = 'Save';
                saveBtn.className = 'table-save-btn save-btn';
                saveBtn.style.marginRight = '8px';
                saveBtn.addEventListener('click', () => {
                    sel.name = nameInput.value;
                    sel.label = nameInput.value;
                    sel.type = typeSelect.value;
                    sel.desc = descInput.value;
                    delete sel._editing;
                    this.renderSchemaFields();
                    this.renderSelections();
                });
                actionsDiv.appendChild(saveBtn);
                const cancelBtn = document.createElement('button');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.className = 'table-cancel-btn cancel-btn';
                cancelBtn.addEventListener('click', () => {
                    delete sel._editing;
                    this.renderSchemaFields();
                });
                actionsDiv.appendChild(cancelBtn);
                editor.appendChild(actionsDiv);

                fieldRow.appendChild(editor);
            }
            schemaCard.appendChild(fieldRow);
        });
    }
    constructor() {
        // PDF rendering state
        this.state = {
            ctx: null,
            isSelecting: false,
            selectionEnabled: true,
            selections: [],
            currentSelection: {},
            images: [], // Array of images for all pages
            pageHeights: [], // Heights of each page
            pageCount: 0,
            pageNum: 0,
            boundaries: [],
            rotation: 0,
            paste_x: 0,
            paste_y: 0,
            target_width: null, // Will be set dynamically
            target_height: null, // Will be set dynamically
            scrollOffset: 0,
            history: [],
            historyIndex: -1,
            isSidebarOpen: true,
            pdfWidth: null,
            pdfHeight: null,
            currentFile: null
        };

        // Rendering throttle flag
        this.renderThrottled = false;

        this.elements = {
            // Document upload elements
            uploadCard: document.querySelector('.upload-card'),
            uploadBtn: document.querySelector('.upload-btn'),
            documentPreview: document.querySelector('.document-preview-container'),
            documentContent: document.querySelector('.document-content'),
            documentName: document.querySelector('.document-name'),
            documentSize: document.querySelector('.document-size'),
            removeFileBtn: document.querySelector('.remove-file-btn'),
            
            // Schema panel elements
            schemaPanel: document.querySelector('.extractor-schema-panel'),
            extractBtn: document.querySelector('.extractor-bottom-bar .dashboard-btn-primary'),
            
            // Dynamic elements (will be created)
            canvas: null,
            fileInput: null,
            loadingOverlay: null,
            viewportsList: null
        };

        this.init();
    }

    init() {
        // Disable original extractor functionality first
        this.disableOriginalExtractor();
        this.setupFileUpload();
        this.setupEventListeners();
        this.setupCanvas();
        this.applyCurrentTheme();
    }

    disableOriginalExtractor() {
        // Prevent the original ExtractorManager file upload from interfering
        console.log('Disabling original ExtractorManager file upload...');
        
        // We don't want to disable the entire ExtractorManager, just its file upload
        // The field editing functionality should remain active
        
        // Remove any existing upload event listeners by cloning buttons
        const existingUploadBtns = document.querySelectorAll('.upload-btn');
        console.log('Found', existingUploadBtns.length, 'upload buttons to override');
        
        existingUploadBtns.forEach((btn, index) => {
            console.log(`Overriding upload button ${index + 1}`);
            // Clone the button to remove all event listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Update our reference to the new buttons
        this.elements.uploadBtn = document.querySelector('.upload-btn');
        console.log('Upload button override complete');
    }

    setupFileUpload() {
        console.log('Setting up file upload...');
        
        // Create hidden file input
        this.elements.fileInput = document.createElement('input');
        this.elements.fileInput.type = 'file';
        this.elements.fileInput.accept = '.pdf';
        this.elements.fileInput.style.display = 'none';
        this.elements.fileInput.id = 'migration-file-input';
        document.body.appendChild(this.elements.fileInput);
        console.log('Created hidden file input');

        // Setup file input change first
        this.elements.fileInput.addEventListener('change', (e) => {
            console.log('File input changed, calling handleFileUpload');
            this.handleFileUpload();
        });
        console.log('File input change handler added');

        // Use event delegation to catch all upload button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.upload-btn') || e.target.closest('.upload-btn')) {
                e.preventDefault();
                e.stopPropagation();
                console.log('Migration upload button clicked via delegation');
                this.elements.fileInput.click();
                return false;
            }
        }, true); // Use capture phase to ensure we get the event first

        // Also setup direct event handlers as backup
        setTimeout(() => {
            const uploadBtns = document.querySelectorAll('.upload-btn');
            console.log('Found', uploadBtns.length, 'upload buttons for direct binding');
            
            uploadBtns.forEach((btn, index) => {
                console.log(`Adding direct click handler to upload button ${index + 1}:`, btn);
                
                // Remove existing listeners by cloning
                const newBtn = btn.cloneNode(true);
                btn.parentNode.replaceChild(newBtn, btn);
                
                // Add our handler
                newBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`Direct upload button ${index + 1} clicked - opening file dialog`);
                    this.elements.fileInput.click();
                });
            });
        }, 100);

        // Setup drag and drop - also override existing
        this.setupDragAndDrop();
    }

    setupDragAndDrop() {
        const uploadCard = this.elements.uploadCard;
        if (!uploadCard) return;

        // Remove existing drag classes and listeners by cloning
        const newUploadCard = uploadCard.cloneNode(true);
        uploadCard.parentNode.replaceChild(newUploadCard, uploadCard);
        this.elements.uploadCard = newUploadCard;

        newUploadCard.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Migration drag over');
            newUploadCard.classList.add('drag-over');
        });

        newUploadCard.addEventListener('dragleave', (e) => {
            e.preventDefault();
            e.stopPropagation();
            newUploadCard.classList.remove('drag-over');
        });

        newUploadCard.addEventListener('drop', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Migration file dropped');
            newUploadCard.classList.remove('drag-over');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type === 'application/pdf') {
                this.handleFile(files[0]);
            } else {
                this.showToast('Please upload a PDF file', 'error');
            }
        });
    }

    setupCanvas() {
        // Create canvas container and canvas
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'document-canvas-container';
        canvasContainer.style.cssText = `
            position: relative;
            overflow: visible;
            height: auto;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            background: #f9fafb;
            padding: 20px;
        `;
        this.elements.canvas = document.createElement('canvas');
        this.elements.canvas.id = 'documentCanvas';
        // Responsive width: get parent width or fallback
    const panel = document.querySelector('.extractor-document-panel') || document.body;
    const availableWidth = panel.clientWidth || 600;
    // Maintain A4 aspect ratio (595x842)
    const aspectRatio = 842 / 595;
    // Use higher minimum width and device pixel ratio for sharpness
    const minWidth = 600;
    this.state.target_width = Math.max(minWidth, Math.min(availableWidth - 32, 1200));
    this.state.target_height = Math.round(this.state.target_width * aspectRatio);
    const dpr = window.devicePixelRatio || 1;
    this.elements.canvas.width = this.state.target_width * dpr;
    this.elements.canvas.height = this.state.target_height * dpr;
    this.elements.canvas.style.width = this.state.target_width + 'px';
    this.elements.canvas.style.height = this.state.target_height + 'px';
        this.elements.canvas.style.cssText = `
            display: block;
            margin: 0 auto;
            cursor: crosshair;
            background: white;
            border: 1px solid #ddd;
            user-select: none;
            -webkit-user-select: none;
            -moz-user-select: none;
            -ms-user-select: none;
            max-width: 100%;
        `;
        this.state.ctx = this.elements.canvas.getContext('2d');
        // Draw a test rectangle to verify canvas is working
        if (this.state.ctx) {
            this.state.ctx.fillStyle = '#f0f0f0';
            this.state.ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
            this.state.ctx.fillStyle = '#666';
            this.state.ctx.font = '16px Arial';
            this.state.ctx.textAlign = 'center';
            this.state.ctx.fillText('Upload a PDF to begin', this.elements.canvas.width / 2, this.elements.canvas.height / 2);
        }
        this.elements.loadingOverlay = document.createElement('div');
        this.elements.loadingOverlay.className = 'canvas-loading-overlay';
        this.elements.loadingOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: none;
            align-items: center;
            justify-content: center;
            z-index: 10;
        `;
        this.elements.loadingOverlay.innerHTML = `
            <div class="loading-spinner" style="
                width: 40px;
                height: 40px;
                border: 4px solid #f3f4f6;
                border-top: 4px solid #3b82f6;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            "></div>
        `;
        canvasContainer.appendChild(this.elements.canvas);
        canvasContainer.appendChild(this.elements.loadingOverlay);
        this.elements.canvasContainer = canvasContainer;
        // Remove viewport list for now
        // this.elements.viewportsList = document.createElement('div');
        // this.elements.viewportsList.className = 'viewports-list';
        // this.elements.viewportsList.style.cssText = `
        //     margin-top: 20px;
        //     max-height: 300px;
        //     overflow-y: auto;
        // `;
        // Add styles for spinner animation
        if (!document.getElementById('migration-styles')) {
            const style = document.createElement('style');
            style.id = 'migration-styles';
            style.textContent = `
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .drag-over {
                    background-color: #eff6ff !important;
                    border-color: #3b82f6 !important;
                }
                .viewport-item {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 8px;
                    display: flex;
                    justify-content: between;
                    align-items: center;
                }
                .viewport-item:hover {
                    background: #f1f5f9;
                }
                .viewport-delete {
                    background: #ef4444;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 4px 8px;
                    cursor: pointer;
                    font-size: 12px;
                }
                .viewport-delete:hover {
                    background: #dc2626;
                }
            `;
            document.head.appendChild(style);
        }
    }

    setupEventListeners() {
        // Remove file button
        if (this.elements.removeFileBtn) {
            this.elements.removeFileBtn.addEventListener('click', this.removeFile.bind(this));
        }

        // Extract button
        if (this.elements.extractBtn) {
            this.elements.extractBtn.addEventListener('click', this.extractDocument.bind(this));
        }

        // Canvas events will be set up when canvas is added to DOM in showDocumentPreview()

        // Keyboard shortcuts
        document.addEventListener('keydown', this.handleKeydown.bind(this));
    }

    setupCanvasEvents() {
        if (!this.elements.canvas) {
            console.log('Canvas not available for event setup');
            return;
        }

        console.log('Setting up canvas events...');
        this.state.ctx = this.elements.canvas.getContext('2d');

        // Remove any existing event listeners first
        this.elements.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.elements.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.elements.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.elements.canvas.removeEventListener('click', this.handleCanvasClick);

        // Remove document event listeners
        document.removeEventListener('mousemove', this.handleDocumentMouseMove);
        document.removeEventListener('mouseup', this.handleDocumentMouseUp);

        // Add canvas event listeners
        this.elements.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.elements.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.elements.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.elements.canvas.addEventListener('click', this.handleCanvasClick.bind(this));

        // Add document event listeners for smooth dragging outside canvas
        this.handleDocumentMouseMove = this.handleMouseMove.bind(this);
        this.handleDocumentMouseUp = this.handleMouseUp.bind(this);
        document.addEventListener('mousemove', this.handleDocumentMouseMove);
        document.addEventListener('mouseup', this.handleDocumentMouseUp);

        console.log('Canvas events successfully attached');

        // Scroll events
        const container = this.elements.canvas.parentElement;
        if (container) {
            container.addEventListener('scroll', () => {
                this.state.scrollOffset = container.scrollTop;
                this.renderSelections();
            });
        }
    }

    async handleFileUpload() {
        const file = this.elements.fileInput.files[0];
        if (!file) return;
        
        console.log('Migration handling file upload:', file.name);
        await this.handleFile(file);
    }

    async handleFile(file) {
        console.log('Migration processing file:', file.name, file.type, file.size);
        
        if (!file.type || file.type !== 'application/pdf') {
            console.log('File type validation failed:', file.type);
            this.showToast('Please select a PDF file', 'error');
            return;
        }
        
        const isValid = await this.validatePDF(file);
        console.log('PDF validation result:', isValid);
        
        if (!isValid) {
            this.showToast('Invalid file: Not a valid PDF', 'error');
            return;
        }

        this.state.currentFile = file;
        console.log('File accepted, showing document preview...');
        this.showDocumentPreview();
        await this.loadPDFPages(file);
    }

    validatePDF(file) {
        console.log('Validating PDF file...');
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const bytes = new Uint8Array(e.target.result);
                const isValid = bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46;
                console.log('PDF header check:', isValid, 'First 4 bytes:', Array.from(bytes.slice(0, 4)));
                resolve(isValid);
            };
            reader.onerror = (e) => {
                console.error('Error reading file for validation:', e);
                resolve(false);
            };
            reader.readAsArrayBuffer(file.slice(0, 4));
        });
    }

    showDocumentPreview() {
        console.log('Showing document preview...');
        // Hide upload card, show preview
        this.elements.uploadCard.style.display = 'none';
        this.elements.documentPreview.style.display = 'block';

        // Update document info
        if (this.elements.documentName) {
            this.elements.documentName.textContent = this.state.currentFile.name;
            console.log('Updated document name:', this.state.currentFile.name);
        }
        if (this.elements.documentSize) {
            this.elements.documentSize.textContent = this.formatFileSize(this.state.currentFile.size);
            console.log('Updated document size:', this.formatFileSize(this.state.currentFile.size));
        }

        // Add canvas to document content
        this.elements.documentContent.innerHTML = '';
        this.elements.documentContent.appendChild(this.elements.canvasContainer);
        // Remove viewport list for now
        // this.elements.documentContent.appendChild(this.elements.viewportsList);
        
        console.log('Canvas container added to document content');
        console.log('Canvas dimensions:', this.elements.canvas.width, 'x', this.elements.canvas.height);
        console.log('Canvas context available:', !!this.state.ctx);
        
        // Now that canvas is in DOM, set up canvas events
        this.setupCanvasEvents();
        console.log('Canvas events set up after adding to DOM');
    }

    async loadPDFPages(file) {
        console.log('Loading PDF pages for file:', file.name);
        this.showLoading(true);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('page_num', 0);

            console.log('Sending request to /create_bot for first page...');
            // Get initial page to determine page count
            const initialResponse = await fetch('/create_bot', { 
                method: 'POST', 
                body: formData 
            });
            
            if (!initialResponse.ok) {
                throw new Error(`HTTP error! status: ${initialResponse.status}`);
            }
            
            const initialResult = await initialResponse.json();
            console.log('Initial response:', initialResult);

            if (initialResult.error) {
                throw new Error(initialResult.error);
            }

            // Initialize state
            this.state.pageCount = initialResult.page_count || 1;
            this.state.images = new Array(this.state.pageCount).fill(null);
            this.state.pageHeights = new Array(this.state.pageCount).fill(this.state.target_height);
            this.state.selections = [];
            this.state.history = [];
            this.state.historyIndex = -1;

            console.log('Page count:', this.state.pageCount);

            // Load first page
            console.log('Loading first page image from:', initialResult.image_url);
            const firstImg = new Image();
            firstImg.crossOrigin = 'anonymous';
            firstImg.onload = () => {
                console.log('First page image loaded successfully');
                console.log('Image dimensions:', firstImg.width, 'x', firstImg.height);
                this.state.images[0] = firstImg;
                this.updateCanvasSize();
                this.renderSelections();
                console.log('First page rendered to canvas');
            };
            firstImg.onerror = (e) => {
                console.error('Failed to load first page image:', e);
                this.showToast('Failed to load PDF image', 'error');
            };
            firstImg.src = initialResult.image_url;

            // Load remaining pages if any
            if (this.state.pageCount > 1) {
                console.log('Loading remaining pages...');
                for (let i = 1; i < this.state.pageCount; i++) {
                    formData.set('page_num', i);
                    const response = await fetch('/create_bot', { method: 'POST', body: formData });
                    const result = await response.json();

                    if (!result.error) {
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        img.onload = () => {
                            console.log(`Page ${i + 1} image loaded`);
                            this.state.images[i] = img;
                            this.renderSelections();
                        };
                        img.src = result.image_url;
                    }
                }
            }

            // Update state and enable selection
            this.state.selectionEnabled = true;
            console.log('PDF loading complete, viewport selection enabled');
            console.log('Current state:', {
                selectionEnabled: this.state.selectionEnabled,
                pageCount: this.state.pageCount,
                imagesLoaded: this.state.images.filter(img => img).length,
                canvasSize: `${this.elements.canvas.width}x${this.elements.canvas.height}`,
                hasContext: !!this.state.ctx
            });
            this.showToast('Document loaded successfully - Click and drag to create viewports');

        } catch (error) {
            console.error('PDF loading error:', error);
            this.showToast('Failed to load PDF: ' + error.message, 'error');
        } finally {
            this.showLoading(false);
        }
    }

    updateCanvasSize() {
        if (!this.state.images.length) {
            return;
        }
    // Responsive width: get parent width or fallback
    const panel = document.querySelector('.extractor-document-panel') || document.body;
    const availableWidth = panel.clientWidth || 600;
    const aspectRatio = 842 / 595;
    const minWidth = 600;
    this.state.target_width = Math.max(minWidth, Math.min(availableWidth - 32, 1200));
    this.state.target_height = Math.round(this.state.target_width * aspectRatio);
    const dpr = window.devicePixelRatio || 1;
    this.elements.canvas.width = this.state.target_width * dpr;
    this.elements.canvas.height = this.state.target_height * this.state.pageCount * dpr;
    this.elements.canvas.style.width = this.state.target_width + 'px';
    this.elements.canvas.style.height = (this.state.target_height * this.state.pageCount) + 'px';
    this.state.ctx = this.elements.canvas.getContext('2d');
        // No scroll reset needed since parent is not scrollable
    }

    renderSelections() {
        if (!this.elements.canvas || !this.state.ctx) {
            return;
        }
        // Clear canvas
        this.state.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        // Draw all pages vertically
        const dpr = window.devicePixelRatio || 1;
        this.state.images.forEach((img, index) => {
            const yOffset = index * this.state.target_height * dpr;
            if (img && img.complete) {
                // Draw at native resolution for sharpness
                this.state.ctx.imageSmoothingEnabled = false;
                this.state.ctx.drawImage(img, 0, yOffset, this.state.target_width * dpr, this.state.target_height * dpr);
            }
        });
        // Render selections
        this.state.selections.forEach((sel, index) => {
            this.renderSelection(sel, index);
        });
        // Render current selection if selecting
        if (this.state.isSelecting && this.state.selectionEnabled) {
            this.renderCurrentSelection();
        }
        // Remove viewport list update for now
        // this.updateViewportsList();
    }

    renderSelection(sel, index) {
        const x = sel.startX;
        const y = sel.startY;
        const width = sel.endX - sel.startX;
        const height = sel.endY - sel.startY;
        this.state.ctx.fillStyle = `rgba(${sel.color.r}, ${sel.color.g}, ${sel.color.b}, 0.2)`;
        this.state.ctx.strokeStyle = `rgba(${sel.color.r}, ${sel.color.g}, ${sel.color.b}, 1)`;
        this.state.ctx.lineWidth = 2;
        this.state.ctx.fillRect(x, y, width, height);
        this.state.ctx.strokeRect(x, y, width, height);
        this.state.ctx.font = 'bold 14px Arial';
        this.state.ctx.fillStyle = `rgba(${sel.color.r}, ${sel.color.g}, ${sel.color.b}, 1)`;
        this.state.ctx.fillText(sel.label, x, y - 5);
    }

    renderCurrentSelection() {
        const { startX, startY, endX, endY } = this.state.currentSelection;
        if (startX === undefined || startY === undefined) return;
        const x = startX;
        const y = startY;
        const width = (endX || startX) - startX;
        const height = (endY || startY) - startY;
        this.state.ctx.strokeStyle = '#22c55e';
        this.state.ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
        this.state.ctx.lineWidth = 2;
        this.state.ctx.setLineDash([5, 5]);
        this.state.ctx.strokeRect(x, y, width, height);
        this.state.ctx.fillRect(x, y, width, height);
        this.state.ctx.setLineDash([]);
    }

    updateViewportsList() {
        if (!this.elements.viewportsList) return;

        this.elements.viewportsList.innerHTML = '';
        
        if (this.state.selections.length === 0) {
            this.elements.viewportsList.innerHTML = `
                <div style="text-align: center; color: #6b7280; padding: 20px;">
                    <p>No viewports selected</p>
                    <p style="font-size: 14px;">Click and drag on the document to create selection areas</p>
                </div>
            `;
            return;
        }

        const title = document.createElement('h4');
        title.textContent = 'Selected Viewports';
        title.style.cssText = 'margin: 0 0 12px 0; font-size: 16px; font-weight: 600; color: #374151;';
        this.elements.viewportsList.appendChild(title);

        this.state.selections.forEach((sel, index) => {
            const item = document.createElement('div');
            item.className = 'viewport-item';
            
            item.innerHTML = `
                <div style="flex: 1;">
                    <div style="font-weight: 600; color: #374151;">${sel.label}</div>
                    <div style="font-size: 12px; color: #6b7280;">Page ${sel.pageNum + 1} • ${Math.round(sel.startX)},${Math.round(sel.startY)} → ${Math.round(sel.endX)},${Math.round(sel.endY)}</div>
                </div>
                <button class="viewport-delete" data-index="${index}">Delete</button>
            `;

            this.elements.viewportsList.appendChild(item);
        });

        // Add delete event listeners
        this.elements.viewportsList.querySelectorAll('.viewport-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const index = parseInt(e.target.dataset.index);
                this.removeSelection(index);
            });
        });
    }

    // Mouse event handlers
    handleMouseDown(e) {
        if (!this.state.images.length || !this.state.selectionEnabled) {
            return;
        }
        e.preventDefault();
        const rect = this.elements.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        this.state.currentSelection = {
            startX: canvasX,
            startY: canvasY,
            endX: canvasX,
            endY: canvasY
        };
        this.state.isSelecting = true;
        this.elements.canvas.style.cursor = 'crosshair';
        document.body.style.cursor = 'crosshair';
    }

    handleMouseMove(e) {
        if (!this.state.isSelecting || !this.state.selectionEnabled) return;
        e.preventDefault();
        const rect = this.elements.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        this.state.currentSelection.endX = canvasX;
        this.state.currentSelection.endY = canvasY;
        if (!this.renderThrottled) {
            this.renderThrottled = true;
            requestAnimationFrame(() => {
                this.renderSelections();
                this.renderThrottled = false;
            });
        }
    }

    handleMouseUp(e) {
        if (!this.state.isSelecting || !this.state.selectionEnabled) {
            return;
        }
        e.preventDefault();
        this.state.isSelecting = false;
        this.elements.canvas.style.cursor = 'crosshair';
        document.body.style.cursor = 'default';
        const { startX, startY, endX, endY } = this.state.currentSelection;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        const minWidth = 20;
        const minHeight = 10;
        if (width > minWidth && height > minHeight) {
            const label = prompt('Enter a label for this viewport:');
            if (label && label.trim()) {
                this.addSelection({
                    startX: Math.min(startX, endX),
                    startY: Math.min(startY, endY),
                    endX: Math.max(startX, endX),
                    endY: Math.max(startY, endY),
                    label: label.trim(),
                    color: this.getRandomColor(),
                    extractedText: ''
                });
                // Render schema fields after adding selection
                this.renderSchemaFields();
            }
        }
        this.state.currentSelection = {};
        this.renderSelections();
    }

    handleCanvasClick(e) {
        if (!this.state.selectionEnabled) return;

        const rect = this.elements.canvas.getBoundingClientRect();
        const scrollTop = this.state.scrollOffset;
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top + scrollTop;

        // Check for delete button clicks
        for (let i = this.state.selections.length - 1; i >= 0; i--) {
            const sel = this.state.selections[i];
            if (sel.deleteButton) {
                const { x, y, size } = sel.deleteButton;
                const yOffset = sel.pageNum * this.state.target_height;
                const adjustedY = y + yOffset - scrollTop;
                
                if (clickX >= x && clickX <= x + size && 
                    clickY >= adjustedY && clickY <= adjustedY + size) {
                    this.removeSelection(i);
                    break;
                }
            }
        }
    }

    handleKeydown(e) {
        if (e.ctrlKey || e.metaKey) {
            if (e.key === 'z') {
                e.preventDefault();
                this.undo();
            } else if (e.key === 'y') {
                e.preventDefault();
                this.redo();
            }
        }
    }

    // Selection management
    addSelection(selection) {
        console.log('Adding viewport selection as field:', selection);
        
        // Use ExtractorManager's handleAddField method directly if available
        if (window.extractorManager && typeof window.extractorManager.handleAddField === 'function') {
            console.log('Using ExtractorManager handleAddField method');
            
            // Create a fake event to trigger handleAddField
            const fakeEvent = { preventDefault: () => {} };
            window.extractorManager.handleAddField(fakeEvent);
            
            // Get the newly created field
            const existingFields = document.querySelectorAll('.extractor-field-row');
            const newField = existingFields[existingFields.length - 1];
            const fieldIndex = existingFields.length;
            
            if (newField) {
                // Store viewport position data in the field element
                newField.setAttribute('data-viewport-position', JSON.stringify({
                    startX: selection.startX,
                    startY: selection.startY,
                    endX: selection.endX,
                    endY: selection.endY
                }));
                
                // Update the field name to use the label from selection
                const fieldName = selection.label || `field_${fieldIndex}`;
                const nameInput = newField.querySelector('.field-name-input');
                const fieldNameSpan = newField.querySelector('.field-name');
                const fieldDescDiv = newField.querySelector('.field-description');
                
                if (nameInput) {
                    nameInput.value = fieldName;
                    nameInput.dispatchEvent(new Event('input')); // Trigger the input event
                }
                
                if (fieldNameSpan) {
                    fieldNameSpan.textContent = fieldName;
                }
                
                if (fieldDescDiv) {
                    fieldDescDiv.textContent = `Description for ${fieldName}`;
                }
                
                console.log('Updated field with viewport data and label:', fieldName);
            }
        } else {
            // Fallback to manual creation if ExtractorManager is not available
            console.log('ExtractorManager not available, using fallback method');
            this.addSelectionFallback(selection);
        }
        
        // Store selection data for later use (including viewport position)
        this.state.selections.push({
            name: selection.label || `field_${document.querySelectorAll('.extractor-field-row').length}`,
            label: selection.label || `field_${document.querySelectorAll('.extractor-field-row').length}`,
            type: 'text',
            desc: '',
            category: 'basic',
            viewport_position: {
                startX: selection.startX,
                startY: selection.startY,
                endX: selection.endX,
                endY: selection.endY
            },
            color: selection.color,
            extractedText: selection.extractedText || ''
        });
        
        this.saveHistory();
        this.renderSelections();
        
        console.log('Added new field with viewport position');
    }
    
    // Fallback method for when ExtractorManager is not available
    addSelectionFallback(selection) {
        const schemaCard = document.querySelector('.extractor-schema-card');
        const addFieldBtn = document.querySelector('.extractor-add-field-btn');
        
        if (!schemaCard || !addFieldBtn) {
            console.error('Schema card or add field button not found');
            return;
        }
        
        // Get the next field index
        const existingFields = document.querySelectorAll('.extractor-field-row');
        const nextIndex = existingFields.length + 1;
        
        // Use the field name from selection label or default naming
        const fieldName = selection.label || `field_${nextIndex}`;
        
        // Create new field HTML using exact same method as extractor.js
        const newFieldHtml = this.createNewFieldHtml(nextIndex, fieldName);
        
        // Insert before the add button
        addFieldBtn.insertAdjacentHTML('beforebegin', newFieldHtml);
        
        // Setup event listeners for the new field only (same as extractor.js)
        const newField = document.getElementById(`field-${nextIndex}`);
        const newEditor = document.getElementById(`editor-${nextIndex}`);
        
        if (newField && newEditor) {
            // Mark this as a newly added field
            newField.setAttribute('data-is-new-field', 'true');
            
            // Store viewport position data in the field element
            newField.setAttribute('data-viewport-position', JSON.stringify({
                startX: selection.startX,
                startY: selection.startY,
                endX: selection.endX,
                endY: selection.endY
            }));
            
            // Add event listeners to the new field's buttons only
            newField.querySelectorAll('.action-btn, .save-btn, .cancel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    // Use extractorManager's handleFieldAction if available
                    if (window.extractorManager && typeof window.extractorManager.handleFieldAction === 'function') {
                        window.extractorManager.handleFieldAction(e);
                    } else {
                        this.handleFieldAction(e);
                    }
                });
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
            if (window.extractorManager && typeof window.extractorManager.setupTableFieldEventsForElement === 'function') {
                window.extractorManager.setupTableFieldEventsForElement(newEditor);
                window.extractorManager.applyThemeStyles();
            }
            
            // Auto-open the edit mode for the new field (same as extractor.js)
            setTimeout(() => {
                if (window.extractorManager && typeof window.extractorManager.editField === 'function') {
                    window.extractorManager.editField(newField, newEditor);
                } else {
                    // Fallback to basic edit mode
                    newField.classList.add('expanded');
                    newEditor.style.display = 'flex';
                }
                
                // Focus on the field name input
                const nameInput = newEditor.querySelector('.field-name-input');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }, 100);
        }
    }
    
    // Create new field HTML using exact same structure as extractor.js
    createNewFieldHtml(index, fieldName = null) {
        const name = fieldName || `new_field_${index}`;
        return `
            <div class="extractor-field-row" id="field-${index}">
                <div class="field-header">
                    <div>
                        <span class="field-name">${name}</span>
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
                <div class="field-description">Description for ${name}</div>
                
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
                            <input type="text" class="form-control field-name-input" value="${name}">
                        </div>
                    </div>
                    <div>
                        <label class="field-label">Field Description</label>
                        <textarea class="form-control field-desc-input" rows="3" placeholder="#DESCRIPTION: short description of the field&#10;&#10;# LABEL SYNONYM: e.g., 'Invoice No.', 'Inv #', 'Ref No.'&#10;&#10;# LOCATION: e.g. in the header or bottom of page or next to delivery address"></textarea>
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
    
    // Basic field action handler (fallback if extractorManager not available)
    handleFieldAction(e) {
        e.preventDefault();
        const btn = e.target.closest('button');
        
        if (!btn) return;
        
        const action = btn.dataset.action;
        const idx = btn.dataset.idx;
        
        console.log(`Handling field action: ${action} for field ${idx}`);
        
        const field = document.getElementById(`field-${idx}`);
        const editor = document.getElementById(`editor-${idx}`);

        if (!field || !editor) return;

        switch (action) {
            case 'edit':
                field.classList.add('expanded');
                editor.style.display = 'flex';
                break;
            case 'save':
                field.classList.remove('expanded');
                editor.style.display = 'none';
                break;
            case 'cancel':
                field.classList.remove('expanded');
                editor.style.display = 'none';
                break;
            case 'delete':
                if (confirm('Delete this field?')) {
                    field.remove();
                }
                break;
        }
    }

    removeSelection(index) {
        if (confirm('Are you sure you want to delete this viewport?')) {
            this.state.selections.splice(index, 1);
            this.saveHistory();
            this.renderSelections();
        }
    }

    saveHistory() {
        this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        this.state.history.push(JSON.stringify(this.state.selections));
        this.state.historyIndex++;
    }

    undo() {
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            this.state.selections = JSON.parse(this.state.history[this.state.historyIndex]);
            this.renderSelections();
        }
    }

    redo() {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            this.state.selections = JSON.parse(this.state.history[this.state.historyIndex]);
            this.renderSelections();
        }
    }

    // Document extraction
    async extractDocument() {
        if (!this.state.currentFile) {
            this.showToast('No document loaded', 'error');
            return;
        }

        if (this.state.selections.length === 0) {
            this.showToast('No viewports selected', 'error');
            return;
        }

        this.showLoading(true);

        try {
            // Get schema fields from the current page
            const schemaFields = this.getSchemaFields();
            
            // Prepare extraction data
            const extractionData = {
                file: this.state.currentFile,
                viewports: this.state.selections.map(sel => ({
                    label: sel.label,
                    startX: sel.startX,
                    startY: sel.startY,
                    endX: sel.endX,
                    endY: sel.endY,
                    pageNum: sel.pageNum
                })),
                schema: schemaFields
            };

            // Call extraction API
            const result = await this.callExtractionAPI(extractionData);
            
            if (result.success) {
                this.displayExtractionResults(result.data);
                this.showToast('Document extracted successfully');
            } else {
                this.showToast('Extraction failed: ' + result.error, 'error');
            }

        } catch (error) {
            this.showToast('Extraction error: ' + error.message, 'error');
            console.error('Extraction error:', error);
        } finally {
            this.showLoading(false);
        }
    }

    getSchemaFields() {
        // Extract schema fields from the current page UI
        const fields = [];
        document.querySelectorAll('.extractor-field-row').forEach(row => {
            const fieldName = row.querySelector('.field-name')?.textContent?.trim();
            const fieldType = row.querySelector('.field-type-badge')?.textContent?.trim();
            const fieldDesc = row.querySelector('.field-description')?.textContent?.trim();
            
            if (fieldName && fieldType) {
                const field = {
                    name: fieldName,
                    type: fieldType,
                    description: fieldDesc || ''
                };

                // Handle table fields with subfields
                if (fieldType === 'table') {
                    const subfields = [];
                    row.querySelectorAll('.subfield-wrapper').forEach(subRow => {
                        const subName = subRow.querySelector('.subfield-name')?.textContent?.trim();
                        const subType = subRow.querySelector('.subfield-type')?.textContent?.trim();
                        const subDesc = subRow.querySelector('.subfield-description')?.textContent?.trim();
                        
                        if (subName && subType) {
                            subfields.push({
                                name: subName,
                                type: subType,
                                description: subDesc || ''
                            });
                        }
                    });
                    field.subfields = subfields;
                }

                fields.push(field);
            }
        });

        return fields;
    }

    async callExtractionAPI(data) {
        const formData = new FormData();
        formData.append('file', data.file);
        formData.append('schema', JSON.stringify(data.schema));
        formData.append('viewports', JSON.stringify(data.viewports));

        const response = await fetch('/extract_document', {
            method: 'POST',
            body: formData
        });

        return await response.json();
    }

    displayExtractionResults(results) {
        // This would integrate with the existing schema panel to show results
        // For now, log the results
        console.log('Extraction results:', results);
        
        // Update the schema panel with extracted values
        this.updateSchemaWithResults(results);
    }

    updateSchemaWithResults(results) {
        // Update field values in the schema panel
        Object.keys(results).forEach(fieldName => {
            const fieldRow = document.querySelector(`[data-field-name="${fieldName}"]`);
            if (fieldRow) {
                // Add extracted value display
                let valueDisplay = fieldRow.querySelector('.extracted-value');
                if (!valueDisplay) {
                    valueDisplay = document.createElement('div');
                    valueDisplay.className = 'extracted-value';
                    valueDisplay.style.cssText = `
                        margin-top: 8px;
                        padding: 8px;
                        background: #f0f9ff;
                        border: 1px solid #bae6fd;
                        border-radius: 4px;
                        font-size: 14px;
                    `;
                    fieldRow.appendChild(valueDisplay);
                }
                
                valueDisplay.innerHTML = `
                    <strong>Extracted:</strong> ${JSON.stringify(results[fieldName], null, 2)}
                `;
            }
        });
    }

    // Utility methods
    removeFile() {
        this.state.currentFile = null;
        this.state.images = [];
        this.state.selections = [];
        this.state.pageCount = 0;
        // Clear schema panel
        this.renderSchemaFields();
        this.elements.documentPreview.style.display = 'none';
        this.elements.uploadCard.style.display = 'block';
        if (this.elements.canvas) {
            this.state.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    getRandomColor() {
        return {
            r: Math.floor(Math.random() * 156) + 100, // 100-255 for better visibility
            g: Math.floor(Math.random() * 156) + 100,
            b: Math.floor(Math.random() * 156) + 100
        };
    }

    showLoading(show) {
        if (this.elements.loadingOverlay) {
            this.elements.loadingOverlay.style.display = show ? 'flex' : 'none';
        }
    }

    showToast(message, type = 'info') {
        // Create toast if it doesn't exist
        let toast = document.getElementById('extraction-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'extraction-toast';
            toast.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 1000;
                opacity: 0;
                transition: opacity 0.3s ease;
                max-width: 300px;
            `;
            document.body.appendChild(toast);
        }

        toast.textContent = message;
        toast.style.backgroundColor = type === 'error' ? '#ef4444' : '#22c55e';
        toast.style.opacity = '1';

        setTimeout(() => {
            toast.style.opacity = '0';
        }, 3000);
    }

    applyCurrentTheme() {
        // Apply theme based on current page theme
        const isDark = document.body.classList.contains('dark-theme') || 
                      document.documentElement.classList.contains('dark');
        
        if (isDark && this.elements.canvas) {
            this.elements.canvas.style.background = '#1f2937';
        }
    }
}

// DOMContentLoaded handler
// Initialize when DOM is loaded - with priority over original extractor
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.extractor-document-panel')) {
        setTimeout(() => {
            // Create ExtractorMigration
            window.extractorMigration = new ExtractorMigration();
            
            // ExtractorManager should already be available from extractor.js
            if (window.ExtractorManager && !window.extractorManager) {
                console.log('Initializing ExtractorManager for field operations...');
                window.extractorManager = new window.ExtractorManager();
                console.log('ExtractorManager initialized for field operations');
            }
        }, 200);
    }
});

// Prevent the original ExtractorManager from interfering with file upload
let checkCount = 0;
const preventOriginal = setInterval(() => {
    checkCount++;
    if (window.extractorManager && window.extractorMigration) {
        // Disable only file upload functionality in ExtractorManager, keep field editing
        const uploadBtns = document.querySelectorAll('.upload-btn');
        uploadBtns.forEach(btn => {
            // Remove existing event listeners by cloning the button
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        console.log('Prevented ExtractorManager file upload interference');
        clearInterval(preventOriginal);
    }
    
    // Stop checking after 5 seconds
    if (checkCount > 50) {
        clearInterval(preventOriginal);
    }
}, 100);

// Export for external use
window.ExtractorMigration = ExtractorMigration;
