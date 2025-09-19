class ExtractorMigration {
    showToast(message, type = 'info') {
        // Simple toast using alert for now
        alert(`${type.toUpperCase()}: ${message}`);
    }

    addSelection(selection) {
        this.state.selections.push(selection);
        this.renderSelections();
        this.renderSchemaFields();
    }

    handleFieldAction(e) {
        e.preventDefault();
        const btn = e.currentTarget;
        const action = btn.dataset.action;
        const idx = btn.dataset.idx;
        const fieldRow = btn.closest('.extractor-field-row');
        const editor = fieldRow.querySelector('.field-editor');
        if (!fieldRow || !editor) return;
        if (action === 'edit') {
            this.editField(fieldRow, editor);
        } else if (action === 'save') {
            this.saveField(fieldRow, editor, idx);
        } else if (action === 'cancel') {
            this.cancelEdit(fieldRow, editor);
        } else if (action === 'delete') {
            this.deleteField(fieldRow, idx);
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
// ...existing code...

    saveField(field, editor, idx) {
        // Update field display with the edited values
        this.updateFieldDisplay(field, editor);
        
        // Remove the "new field" marker if it exists (field is now saved)
        if (field.hasAttribute('data-is-new-field')) {
            field.removeAttribute('data-is-new-field');
        }
        
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
        // (columns withouth originalValue data are newly added during this edit session)
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

        // If this is a newly added field that hasn't been saved, remove it
        if (field.hasAttribute('data-is-new-field')) {
            field.remove();
            return;
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
    
    renderSchemaFields() {
        const schemaCard = document.querySelector('.extractor-schema-card');
        if (!schemaCard) return;
        // Remove all field rows
        schemaCard.querySelectorAll('.extractor-field-row').forEach(row => row.remove());
        // Add a field row for each selection
        this.state.selections.forEach((sel, idx) => {
            const fieldRow = document.createElement('div');
            fieldRow.className = 'extractor-field-row';
            fieldRow.setAttribute('data-field-name', sel.label);
            fieldRow.innerHTML = `
                <div class="field-header">
                    <div>
                        <span class="field-name">${sel.label}</span>
                    </div>
                </div>
            `;
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

        // Setup action button listeners
        setTimeout(() => {
            document.querySelectorAll('.action-btn, .save-btn, .cancel-btn').forEach(btn => {
                btn.addEventListener('click', this.handleFieldAction.bind(this));
            });
        }, 500);
    }

    disableOriginalExtractor() {
        // Prevent the original ExtractorManager from interfering
        if (window.ExtractorManager) {
            console.log('Disabling original ExtractorManager to avoid conflicts');
        }
        
        // Remove any existing upload event listeners
        const existingUploadBtns = document.querySelectorAll('.upload-btn');
        existingUploadBtns.forEach(btn => {
            // Clone the button to remove all event listeners
            const newBtn = btn.cloneNode(true);
            btn.parentNode.replaceChild(newBtn, btn);
        });
        
        // Update our reference to the new button
        this.elements.uploadBtn = document.querySelector('.upload-btn');
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

        // Ensure methods are bound before adding event listeners
        this.handleMouseDown = this.handleMouseDown.bind(this);
        this.handleMouseMove = this.handleMouseMove.bind(this);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.handleDocumentMouseMove = this.handleMouseMove.bind(this);
        this.handleDocumentMouseUp = this.handleMouseUp.bind(this);

        // Remove any existing event listeners first
        this.elements.canvas.removeEventListener('mousedown', this.handleMouseDown);
        this.elements.canvas.removeEventListener('mousemove', this.handleMouseMove);
        this.elements.canvas.removeEventListener('mouseup', this.handleMouseUp);
        this.elements.canvas.removeEventListener('click', this.handleCanvasClick);

        // Remove document event listeners
        document.removeEventListener('mousemove', this.handleDocumentMouseMove);
        document.removeEventListener('mouseup', this.handleDocumentMouseUp);

        // Add canvas event listeners
        this.elements.canvas.addEventListener('mousedown', this.handleMouseDown);
        this.elements.canvas.addEventListener('mousemove', this.handleMouseMove);
        this.elements.canvas.addEventListener('mouseup', this.handleMouseUp);
        this.elements.canvas.addEventListener('click', this.handleCanvasClick);

        // Add document event listeners for smooth dragging outside canvas
        document.addEventListener('mousemove', this.handleDocumentMouseMove);
        document.addEventListener('mouseup', this.handleDocumentMouseUp);
    }

    handleCanvasClick(e) {
        console.log('Canvas clicked:', e);
        // Placeholder for canvas click handling logic
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
        // Ensure canvasContainer is initialized
        if (!this.elements.canvasContainer) {
            console.error('Canvas container is not initialized. Calling setupCanvas...');
            this.setupCanvas();
        }

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

    showLoading(message = 'Loading...') {
        console.log('Show loading overlay:', message);
        // Placeholder: Implement loading overlay logic if needed
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
        if (!this.state.isSelecting || !this.state.selectionEnabled) return;
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
            const label = prompt('Enter label for the selection:');
            if (label) {
                const selection = {
                    startX,
                    startY,
                    endX,
                    endY,
                    label,
                    color: this.getRandomColor()
                };
                this.addSelection(selection);
            }
        }

        this.state.currentSelection = {};
        this.renderSelections();
    }



    renderSelections() {
        if (!this.elements.canvas || !this.state.ctx) return;
        this.state.ctx.clearRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
        const dpr = window.devicePixelRatio || 1;
        this.state.images.forEach((img, index) => {
            const yOffset = index * this.state.target_height * dpr;
            this.state.ctx.drawImage(img, 0, yOffset, this.state.target_width * dpr, this.state.target_height * dpr);
        });
        this.state.selections.forEach((sel, index) => {
            this.renderSelection(sel, index);
        });
        if (this.state.isSelecting && this.state.selectionEnabled) {
            this.renderCurrentSelection();
        }
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

    getRandomColor() {
        return {
            r: Math.floor(Math.random() * 156) + 100,
            g: Math.floor(Math.random() * 156) + 100,
            b: Math.floor(Math.random() * 156) + 100
        };
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile() {
        console.log('Remove file button clicked');
        // Placeholder for remove file logic
    }

    extractDocument() {
        console.log('Extract document button clicked');
        // Placeholder for extract document logic
    }

    handleKeydown(e) {
        console.log('Keydown event:', e);
        // Placeholder for keyboard shortcut logic
    }

    applyCurrentTheme() {
        console.log('Applying current theme (placeholder)');
        // Add theme application logic here if needed
    }
}

// DOMContentLoaded handler
// Initialize when DOM is loaded - with priority over original extractor
document.addEventListener('DOMContentLoaded', () => {
    if (document.querySelector('.extractor-document-panel')) {
        setTimeout(() => {
            if (window.extractorManager) {
                window.extractorManager = null;
            }
            window.extractorMigration = new ExtractorMigration();
        }, 200);
    }
});

// Also prevent the original from initializing by monitoring for it
let checkCount = 0;
const preventOriginal = setInterval(() => {
    checkCount++;
    if (window.extractorManager && !window.extractorMigration) {
        console.log('ExtractorMigration: Detected original ExtractorManager, blocking...');
        window.extractorManager = null;
    }
    
    // Stop checking after 5 seconds
    if (checkCount > 50) {
        clearInterval(preventOriginal);
    }
}, 100);

// Export for external use
window.ExtractorMigration = ExtractorMigration;
