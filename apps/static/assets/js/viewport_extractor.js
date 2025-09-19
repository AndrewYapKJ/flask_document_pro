/**
 * Extractor Page JavaScript
 * Handles field editing, table management, and theme switching
 */

class ExtractorManager {
    // --- Rectangle Drawing State ---
    // Use a single canvas and context for drawing and PDF display
    isSelecting = false;
    selectionEnabled = true;
    currentSelection = {};
    selections = [];
    selectionsByPage = {};
    currentPageNum = 1;
    canvas = null;
    ctx = null;
    images = [];
    target_width = 712;
    target_height = 1008;

    setupCanvas() {
        // Create canvas if not present
        const container = document.querySelector('.document-content');
        if (!container) return;
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = 'documentCanvas';
            this.canvas.width = this.target_width;
            this.canvas.height = this.target_height;
            this.canvas.style.width = this.target_width + 'px';
            this.canvas.style.height = this.target_height + 'px';
            this.canvas.style.display = 'block';
            this.canvas.style.cursor = 'crosshair';
            container.appendChild(this.canvas);
        }
        this.ctx = this.canvas.getContext('2d');
        // Attach mouse event listeners
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.renderSelections();
    }

    handleMouseDown(e) {
        if (!this.images.length || !this.selectionEnabled) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        this.currentSelection = {
            startX: canvasX,
            startY: canvasY,
            endX: canvasX,
            endY: canvasY
        };
        this.isSelecting = true;
        this.canvas.style.cursor = 'crosshair';
        document.body.style.cursor = 'crosshair';
    }

    handleMouseMove(e) {
        if (!this.isSelecting || !this.selectionEnabled) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        this.currentSelection.endX = canvasX;
        this.currentSelection.endY = canvasY;
        // Use requestAnimationFrame for smooth drawing
        if (!this._drawing) {
            this._drawing = true;
            window.requestAnimationFrame(() => {
                this.renderSelections();
                this._drawing = false;
            });
        }
    }

    handleMouseUp(e) {
        if (!this.isSelecting || !this.selectionEnabled) return;
        e.preventDefault();
        this.isSelecting = false;
        this.canvas.style.cursor = 'crosshair';
        document.body.style.cursor = 'default';
        const { startX, startY, endX, endY } = this.currentSelection;
        const width = Math.abs(endX - startX);
        const height = Math.abs(endY - startY);
        const minWidth = 20;
        const minHeight = 10;
        if (width > minWidth && height > minHeight) {
            let label = prompt('Enter unique field_name for the selection:');
            if (!label) {
                label = `Viewport_${this.selections.length + 1}`;
            }
            // Check for duplicate field_name
            const fieldNameExists = this.selections.some(sel => sel.label === label);
            if (fieldNameExists) {
                alert('field_name already exists. Please enter a unique field_name.');
                this.currentSelection = {};
                this.renderSelections();
                return;
            }
            const selection = {
                startX: Math.min(startX, endX),
                startY: Math.min(startY, endY),
                endX: Math.max(startX, endX),
                endY: Math.max(startY, endY),
                label,
                color: this.getRandomColor(),
                rect: {
                    x: Math.min(startX, endX),
                    y: Math.min(startY, endY),
                    width: width,
                    height: height
                }
            };
            this.selections.push(selection);
            // Add to schema field list
            this.addRectangleFieldToSchema(selection);
        }
        this.currentSelection = {};
        this.renderSelections();
    }
    // Add rectangle field to schema list and display
    addRectangleFieldToSchema(selection) {
        // Find the schema container and add button
        const schemaCard = document.querySelector('.extractor-schema-card');
        if (!schemaCard) return;
        // Get the next field index
        const existingFields = schemaCard.querySelectorAll('.extractor-field-row');
        const nextIndex = existingFields.length + 1;
        // Create new field HTML using the same structure as normal fields
        let newFieldHtml = this.createNewFieldHtml(nextIndex);
        // Append to schema card
        schemaCard.insertAdjacentHTML('beforeend', newFieldHtml);
        // Setup event listeners for the new field only
        const newField = schemaCard.querySelector(`#field-${nextIndex}`);
        const newEditor = schemaCard.querySelector(`#editor-${nextIndex}`);
        if (newField && newEditor) {
            // Mark this as a newly added field
            newField.setAttribute('data-is-new-field', 'true');
            // Set label and type
            const fieldNameSpan = newField.querySelector('.field-name');
            if (fieldNameSpan) fieldNameSpan.textContent = selection.label;
            const typeBadge = newField.querySelector('.field-type-badge');
            if (typeBadge) {
                typeBadge.textContent = 'text'; // default type is text
                typeBadge.className = 'field-type-badge text';
            }
            // Update the Viewport Description textarea with rectangle data
            const viewportDescTextarea = newEditor.querySelector(`#viewport-description-${nextIndex}`);
            if (viewportDescTextarea) {
                viewportDescTextarea.value = `Rectangle: x: ${selection.rect.x}, y: ${selection.rect.y}, w: ${selection.rect.width}, h: ${selection.rect.height}`;
            }
            // Hide editor by default
            newEditor.style.display = 'none';
            // Add event listeners to the new field's buttons only
            newField.querySelectorAll('.action-btn, .save-btn, .cancel-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleFieldAction(e));
            });
            // Add event listeners to the new field's select and inputs for real-time editing
            const nameInput = newEditor.querySelector('.field-name-input');
            const descInput = newEditor.querySelector('.field-desc-input');
            if (nameInput) {
                // Set initial value to rectangle label
                nameInput.value = selection.label;
                nameInput.addEventListener('input', (e) => {
                    const fieldNameSpan = newField.querySelector('.field-name');
                    if (fieldNameSpan) {
                        fieldNameSpan.textContent = e.target.value || 'unnamed_field';
                    }
                    // Sync rectangle label in selections
                    const newLabel = e.target.value || 'unnamed_field';
                    const selIdx = this.selections.findIndex(sel => sel.label === selection.label);
                    if (selIdx !== -1) {
                        this.selections[selIdx].label = newLabel;
                        selection.label = newLabel;
                        this.renderSelections();
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
            // Auto-open the edit mode for the new field (like extractor.js)
            setTimeout(() => {
                this.editField(newField, newEditor);
                const nameInput = newEditor.querySelector('.field-name-input');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                }
            }, 100);
        }
    }
    

    renderSelections() {
        if (!this.canvas || !this.ctx) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let yOffset = 0;
        for (let i = 0; i < this.images.length; i++) {
            const img = this.images[i];
            if (img.complete) {
                this.ctx.drawImage(img, 0, yOffset, img.width, img.height);
            }
            yOffset += img.height;
        }
        // Draw all rectangles
        this.selections.forEach((sel, index) => {
            this.renderSelection(sel, index);
        });
        // Draw current selection if in progress
        if (this.isSelecting && this.currentSelection.startX !== undefined && this.currentSelection.startY !== undefined) {
            this.renderCurrentSelection();
        }
    }

    renderSelection(sel, index) {
        const x = sel.startX;
        const y = sel.startY;
        const width = sel.endX - sel.startX;
        const height = sel.endY - sel.startY;
        this.ctx.fillStyle = `rgba(${sel.color.r}, ${sel.color.g}, ${sel.color.b}, 0.2)`;
        this.ctx.strokeStyle = `rgba(${sel.color.r}, ${sel.color.g}, ${sel.color.b}, 1)`;
        this.ctx.lineWidth = 2;
        this.ctx.fillRect(x, y, width, height);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillStyle = `rgba(${sel.color.r}, ${sel.color.g}, ${sel.color.b}, 1)`;
        this.ctx.fillText(sel.label, x, y - 5);
    }

    renderCurrentSelection() {
        const { startX, startY, endX, endY } = this.currentSelection;
        if (startX === undefined || startY === undefined) return;
        const x = startX;
        const y = startY;
        const width = (endX || startX) - startX;
        const height = (endY || startY) - startY;
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.fillStyle = 'rgba(34, 197, 94, 0.1)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(x, y, width, height);
        this.ctx.fillRect(x, y, width, height);
        this.ctx.setLineDash([]);
    }
    

    getRandomColor() {
        return {
            r: Math.floor(Math.random() * 156) + 100,
            g: Math.floor(Math.random() * 156) + 100,
            b: Math.floor(Math.random() * 156) + 100
        };
    }
    constructor() {
        // Initialize PDF-related properties
        this.currentPDF = null;
        this.currentContainer = null;
        this.baseScale = null;
        this.baseViewport = null;
        this.resizeListener = null;
        this.resizeObserver = null;
        this.sidebarObserver = null;
        this.resizeTimeout = null;
        this.lastContainerWidth = 0;
        
        // Initialize extraction-related properties
        this.originalSchemaContent = null;
        this.lastExtractionResults = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTableFieldEvents();
        this.reinitializeEventListeners();
        this.applyThemeStyles();
        this.setupThemeObserver();
        this.initializeUploadState();
    }

    initializeUploadState() {
        // Add upload-only class for initial centering since no document is loaded
        const documentPanel = document.querySelector('.extractor-document-panel');
        if (documentPanel) {
            documentPanel.classList.add('upload-only');
        }
    }

    // Call this after PDF/image is loaded and preview is shown
    showDocumentPreviewWithViewport(image) {
        if (image) {
            this.images = [image];
        }
        this.setupCanvas();
    }

    // Call this after PDF/image is loaded and preview is shown
    showDocumentPreviewWithViewport() {
        // ...existing logic to show preview...
        this.setupCanvasForViewport();
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
            if (!input.hasAttribute('data-listener-attached')) {
                input.addEventListener('input', (e) => {
                    const field = e.target.closest('.extractor-field-row');
                    const fieldNameSpan = field.querySelector('.field-name');
                    if (fieldNameSpan) {
                        fieldNameSpan.textContent = e.target.value || 'unnamed_field';
                    }
                });
                input.setAttribute('data-listener-attached', 'true');
            }
        });

        // Add event listeners for real-time field description updates
        document.querySelectorAll('.field-desc-input').forEach(textarea => {
            if (!textarea.hasAttribute('data-listener-attached')) {
                textarea.addEventListener('input', (e) => {
                    const field = e.target.closest('.extractor-field-row');
                    const fieldDescDiv = field.querySelector('.field-description');
                    if (fieldDescDiv) {
                        fieldDescDiv.textContent = e.target.value || 'No description provided';
                    }
                });
                textarea.setAttribute('data-listener-attached', 'true');
            }
        });
    }

    handleNavbarToggle() {
        const mainRow = document.querySelector('.extractor-main-row');
        // Auto-adjust based on navbar state if needed
    }

    handleFieldAction(e) {
        e.preventDefault();
        const btn = e.target.closest('button');
        
        if (!btn) {
            console.error('No button found in handleFieldAction');
            return;
        }
        
        const action = btn.dataset.action;
        const idx = btn.dataset.idx;
        
        console.log(`Handling field action: ${action} for field ${idx}`);
        
        const field = document.getElementById(`field-${idx}`);
        const editor = document.getElementById(`editor-${idx}`);

        if (!field || !editor) {
            console.error(`Field or editor not found: field-${idx}, editor-${idx}`);
            return;
        }

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
            default:
                console.error(`Unknown action: ${action}`);
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
        // Get the field name input value
        const fieldNameInput = editor.querySelector('.field-name-input');
        const fieldName = fieldNameInput ? fieldNameInput.value.trim() : '';
        
        // Validate field name is not empty
        if (!fieldName) {
            alert('Field name is required. Please enter a valid field name.');
            if (fieldNameInput) {
                fieldNameInput.focus();
                fieldNameInput.style.border = '2px solid #dc3545';
                setTimeout(() => {
                    fieldNameInput.style.border = '';
                }, 3000);
            }
            return;
        }
        
        // Get current field name from display (for editing existing fields)
        const currentFieldNameSpan = field.querySelector('.field-name');
        const currentFieldName = currentFieldNameSpan ? currentFieldNameSpan.textContent : '';
        
        // Always check for uniqueness (even if name hasn't changed, to catch edge cases)
        // Get all existing field names from the display, excluding the current field being edited
        const currentFieldElement = field; // The field being edited
        const allFieldElements = Array.from(document.querySelectorAll('.extractor-field-row'));
        const allFieldNames = [];
        
        allFieldElements.forEach(fieldElement => {
            // Skip the current field being edited
            if (fieldElement === currentFieldElement) return;
            
            const fieldNameSpan = fieldElement.querySelector('.field-name');
            if (fieldNameSpan && fieldNameSpan.textContent.trim()) {
                allFieldNames.push(fieldNameSpan.textContent.trim());
            }
        });
        
        // Also check selections array (for viewport selections)
        this.selections.forEach(sel => {
            if (sel.label && sel.label !== currentFieldName) {
                allFieldNames.push(sel.label);
            }
        });
        
        // Check if the new field name already exists
        const isDuplicate = allFieldNames.includes(fieldName);
        
        console.log('=== FIELD NAME VALIDATION ===');
        console.log('Field being saved:', fieldName);
        console.log('Current field name (before change):', currentFieldName);
        console.log('All existing field names found:', allFieldNames);
        console.log('Is duplicate?', isDuplicate);
        console.log('Number of existing fields found:', allFieldElements.length);
        console.log('=============================');
        
        if (isDuplicate) {
            const message = `Field name "${fieldName}" already exists!\n\nExisting field names:\n${allFieldNames.join(', ')}\n\nPlease enter a unique field name.`;
            alert(message);
            if (fieldNameInput) {
                fieldNameInput.focus();
                fieldNameInput.select();
                fieldNameInput.style.border = '2px solid #dc3545';
                fieldNameInput.style.backgroundColor = '#ffebee';
                setTimeout(() => {
                    fieldNameInput.style.border = '';
                    fieldNameInput.style.backgroundColor = '';
                }, 3000);
            }
            return;
        }
        
        // Update the label in selections array if this field exists there
        const selectionIndex = this.selections.findIndex(sel => sel.label === currentFieldName);
        if (selectionIndex !== -1) {
            this.selections[selectionIndex].label = fieldName;
        }
        
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
            // Check if table has at least one column
            const tableColumns = editor.querySelectorAll('.table-column-row');
            if (tableColumns.length === 0) {
                alert('Table fields must have at least one column. Please add columns before saving.');
                return;
            }
            
            // Validate and sync table columns - if validation fails, don't save
            const syncResult = this.syncTableConfigurationToDisplay(field, editor);
            if (syncResult === false) {
                // Validation failed, keep editor open
                return;
            }
            
            tableSubfields.style.display = 'block';
            field.classList.add('table-field');
        }

        console.log('Saving field:', idx, 'with name:', fieldName);
        
        // Show success feedback
        const saveBtn = editor.querySelector('.save-btn');
        if (saveBtn) {
            const originalText = saveBtn.textContent;
            saveBtn.textContent = 'Saved!';
            saveBtn.style.backgroundColor = '#28a745';
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.backgroundColor = '';
            }, 1500);
        }
    }

    syncTableConfigurationToDisplay(field, editor) {
        const tableColumns = editor.querySelectorAll('.table-column-row');
        const subfieldsContainer = field.querySelector('.subfields-container');
        const addSubfieldBtn = subfieldsContainer?.querySelector('.add-subfield-btn');
        
        if (!subfieldsContainer || !addSubfieldBtn) return;

        // Validate table column names before syncing
        const columnNames = [];
        let hasValidationError = false;
        
        for (let columnRow of tableColumns) {
            const nameInput = columnRow.querySelector('.column-name-input');
            const columnName = nameInput?.value?.trim() || '';
            
            // Check if column name is empty
            if (!columnName) {
                alert('All table column names are required. Please enter valid column names.');
                if (nameInput) {
                    nameInput.focus();
                    nameInput.style.border = '2px solid #dc3545';
                    setTimeout(() => {
                        nameInput.style.border = '';
                    }, 3000);
                }
                hasValidationError = true;
                break;
            }
            
            // Check for duplicate column names within this table
            if (columnNames.includes(columnName)) {
                alert(`Duplicate column name "${columnName}" found. All column names within a table must be unique.`);
                if (nameInput) {
                    nameInput.focus();
                    nameInput.select();
                    nameInput.style.border = '2px solid #dc3545';
                    setTimeout(() => {
                        nameInput.style.border = '';
                    }, 3000);
                }
                hasValidationError = true;
                break;
            }
            
            columnNames.push(columnName);
        }
        
        // Return false if validation failed to prevent saving
        if (hasValidationError) {
            return false;
        }

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
        
        // Return true to indicate successful validation and sync
        return true;
    }

    updateFieldDisplay(field, editor) {
        // Update field name
        const nameInput = editor.querySelector('.field-name-input');
        const fieldNameSpan = field.querySelector('.field-name');
        if (nameInput && fieldNameSpan) {
            fieldNameSpan.textContent = nameInput.value || 'unnamed_field';
            // Always find rectangle by previous label and update only label
            const newLabel = nameInput.value || 'unnamed_field';
            const prevLabel = editor.dataset.originalFieldName;
            const selIdx = this.selections.findIndex(sel => sel.label === prevLabel);
            if (selIdx !== -1) {
                this.selections[selIdx].label = newLabel;
                this.renderSelections();
            }
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
                // Show table config and subfields UI, create if missing
                const fieldEditor = editor;
                const tableConfig = fieldEditor.querySelector('.table-config');
                const tableSubfields = field.querySelector('.table-subfields');
                this.showTableConfiguration(tableConfig, tableSubfields, field);
            } else {
                field.classList.remove('table-field');
                // Hide table config and subfields UI
                const fieldEditor = editor;
                const tableConfig = fieldEditor.querySelector('.table-config');
                const tableSubfields = field.querySelector('.table-subfields');
                this.hideTableConfiguration(tableConfig, tableSubfields, field);
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

    // Cancel should NOT delete field or rectangle, just restore values and close editor

        field.classList.remove('expanded');
        editor.style.display = 'none';
    }

    deleteField(field, idx) {
        if (confirm('Delete this field?')) {
            // Remove corresponding rectangle from selections
            const fieldNameSpan = field.querySelector('.field-name');
            const label = fieldNameSpan ? fieldNameSpan.textContent : null;
            if (label) {
                const selIdx = this.selections.findIndex(sel => sel.label === label);
                if (selIdx !== -1) {
                    this.selections.splice(selIdx, 1);
                    this.renderSelections();
                }
            }
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
            // Mark this as a newly added field
            newField.setAttribute('data-is-new-field', 'true');
            
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
                        <textarea class="form-control field-desc-input" rows="3" placeholder="#DESCRIPTION: short description of the field&#10;&#10;# LABEL SYNONYM: e.g., 'Invoice No.', 'Inv #', 'Ref No.'&#10;&#10;# LOCATION: e.g. in the header or bottom of page or next to delivery address"></textarea>
                    </div>
                    <div>
                        <label class="field-label">Viewport Description</label>
                        <textarea id="viewport-description-${index}" class="form-control viewport-description" rows="3" readonly></textarea>
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
        const documentPanel = document.querySelector('.extractor-document-panel');
        
        if (!uploadCard || !documentPreview) {
            console.error('Upload card or document preview container not found');
            return;
        }
        
        // Remove upload-only class for centering since we're showing document
        if (documentPanel) {
            documentPanel.classList.remove('upload-only');
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
    // Cleanup any existing observers
    this.cleanupPDFObservers();
    // Clear existing content
    documentContent.innerHTML = '<div class="loading-preview">Loading document...</div>';
    if (file.type === 'application/pdf') {
        this.renderPDFWithCanvas(documentContent, file);
    } else if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
        // Render image onto canvas and enable rectangle drawing
        const img = new window.Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            documentContent.innerHTML = '';
            this.images = [img];
            this.target_width = img.width;
            this.target_height = img.height;
            this.setupCanvas();
            this.canvas.width = img.width;
            this.canvas.height = img.height;
            this.canvas.style.width = img.width + 'px';
            this.canvas.style.height = img.height + 'px';
            this.ctx = this.canvas.getContext('2d');
            documentContent.appendChild(this.canvas);
            this.renderSelections();
        };
        img.onerror = () => {
            documentContent.innerHTML = '<div class="error">Failed to load image.</div>';
        };
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
            const pdf = await pdfjsLib.getDocument(fileURL).promise;
            container.innerHTML = '';
            this.images = [];
            let maxWidth = 0, totalHeight = 0;
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 1 });
                const containerWidth = container.clientWidth || 600;
                const displayScale = Math.min((containerWidth - 20) / viewport.width, 3);
                const scaledViewport = page.getViewport({ scale: displayScale });
                const pageCanvas = document.createElement('canvas');
                pageCanvas.width = scaledViewport.width;
                pageCanvas.height = scaledViewport.height;
                pageCanvas.style.width = scaledViewport.width + 'px';
                pageCanvas.style.height = scaledViewport.height + 'px';
                const pageCtx = pageCanvas.getContext('2d');
                await page.render({ canvasContext: pageCtx, viewport: scaledViewport }).promise;
                const img = new Image();
                img.src = pageCanvas.toDataURL();
                await new Promise(res => { img.onload = res; });
                this.images.push(img);
                maxWidth = Math.max(maxWidth, scaledViewport.width);
                totalHeight += scaledViewport.height;
            }
            this.target_width = maxWidth;
            this.target_height = totalHeight;
            this.setupCanvas();
            this.canvas.width = maxWidth;
            this.canvas.height = totalHeight;
            this.canvas.style.width = maxWidth + 'px';
            this.canvas.style.height = totalHeight + 'px';
            this.ctx = this.canvas.getContext('2d');
            container.style.overflowY = 'auto';
            container.style.maxHeight = '80vh';
            container.appendChild(this.canvas);
            this.renderSelections();
        } catch (error) {
            container.innerHTML = `<div class="pdf-error"><p>Error loading PDF: ${error.message}</p></div>`;
        }
    }

    async renderPDFPage(pdf, pageNum, container, displayScale = null) {
        try {
            const page = await pdf.getPage(pageNum);
            
            // Create canvas for this page
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Get device pixel ratio for high-DPI displays
            const devicePixelRatio = window.devicePixelRatio || 1;
            
            // Use provided scale or calculate new one
            let finalDisplayScale;
            if (displayScale !== null) {
                finalDisplayScale = displayScale;
            } else {
                // Fallback calculation if no scale provided
                const containerWidth = container.clientWidth || 600;
                const viewport = page.getViewport({ scale: 1 });
                finalDisplayScale = Math.min((containerWidth - 20) / viewport.width, 3);
            }
            
            // Calculate viewport and render scale
            const viewport = page.getViewport({ scale: 1 });
            const renderScale = finalDisplayScale * 3 * devicePixelRatio; 
            const scaledViewport = page.getViewport({ scale: renderScale });

            // Set canvas dimensions (high resolution)
            canvas.width = scaledViewport.width;
            canvas.height = scaledViewport.height;
            
            // Set display dimensions (consistent across all pages)
            const displayWidth = (viewport.width * finalDisplayScale);
            const displayHeight = (viewport.height * finalDisplayScale);
            
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
            // Attach mouse event listeners for drawing
            canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            console.log(`[renderPDFPage] Mouse event listeners attached to PDF page canvas for page ${pageNum}`);

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

    setupPDFResizeListener() {
        // Remove existing listeners if any
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }
        
        // Use ResizeObserver for immediate container width changes
        if (this.currentContainer && 'ResizeObserver' in window) {
            this.resizeObserver = new ResizeObserver((entries) => {
                for (let entry of entries) {
                    const newWidth = entry.contentRect.width;
                    if (Math.abs(newWidth - this.lastContainerWidth) > 10) {
                        this.lastContainerWidth = newWidth;
                        clearTimeout(this.resizeTimeout);
                        this.resizeTimeout = setTimeout(() => {
                            this.handlePDFResize();
                        }, 100);
                    }
                }
            });
            this.resizeObserver.observe(this.currentContainer);
            this.lastContainerWidth = this.currentContainer.clientWidth;
        }
        
        // Fallback window resize listener
        this.resizeListener = () => {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = setTimeout(() => {
                this.handlePDFResize();
            }, 150);
        };
        window.addEventListener('resize', this.resizeListener);
        
        // Listen for sidebar toggle specifically
        const navbar = document.querySelector('.pcoded-navbar');
        if (navbar) {
            const observer = new MutationObserver(() => {
                setTimeout(() => {
                    this.handlePDFResize();
                }, 350); // Wait for sidebar animation
            });
            observer.observe(navbar, { 
                attributes: true, 
                attributeFilter: ['class'] 
            });
            this.sidebarObserver = observer;
        }
    }

    handlePDFResize() {
        if (!this.currentPDF || !this.currentContainer || !this.baseViewport) {
            return;
        }
        
        // Force a reflow to get accurate container width
        this.currentContainer.style.display = 'none';
        this.currentContainer.offsetHeight; // Trigger reflow
        this.currentContainer.style.display = '';
        
        // Get the actual current container width
        const containerWidth = this.currentContainer.clientWidth || this.currentContainer.offsetWidth || 600;
        const newDisplayScale = Math.min((containerWidth - 20) / this.baseViewport.width, 3);
        
        console.log('Resize detected:', {
            containerWidth,
            oldScale: this.baseScale,
            newScale: newDisplayScale
        });
        
        // Re-render if scale changed (even small changes for responsiveness)
        if (Math.abs(newDisplayScale - this.baseScale) > 0.02) {
            this.baseScale = newDisplayScale;
            this.reRenderPDFPages();
        }
    }

    async reRenderPDFPages() {
        if (!this.currentPDF || !this.currentContainer) {
            return;
        }
        
        // Clear existing pages
        this.currentContainer.innerHTML = '';
        
        // Re-render all pages with new scale
        for (let pageNum = 1; pageNum <= this.currentPDF.numPages; pageNum++) {
            await this.renderPDFPage(this.currentPDF, pageNum, this.currentContainer, this.baseScale);
        }
    }

    cleanupPDFObservers() {
        if (this.resizeListener) {
            window.removeEventListener('resize', this.resizeListener);
            this.resizeListener = null;
        }
        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
            this.resizeObserver = null;
        }
        if (this.sidebarObserver) {
            this.sidebarObserver.disconnect();
            this.sidebarObserver = null;
        }
        if (this.resizeTimeout) {
            clearTimeout(this.resizeTimeout);
            this.resizeTimeout = null;
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
        
        // Show upload card and add centering class
        const uploadCard = document.querySelector('.upload-card');
        const documentPanel = document.querySelector('.extractor-document-panel');
        if (uploadCard) {
            uploadCard.style.display = 'block';
        }
        if (documentPanel) {
            documentPanel.classList.add('upload-only');
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

        // Get the current schema configuration with position data
        const schemaConfig = this.getCurrentSchemaConfig();
        
        console.log('=== EXTRACTION REQUEST ===');
        console.log('Schema config with positions:', JSON.stringify(schemaConfig, null, 2));
        console.log('==========================');
        
        // Show loading state
        this.showExtractionLoading();
        
        // Create FormData for file upload
        const formData = new FormData();
        formData.append('file', this.selectedFile);
        formData.append('schema', JSON.stringify(schemaConfig));
        
        // Add additional metadata for OpenAI processing
        formData.append('extractionMetadata', JSON.stringify({
            hasPositionData: schemaConfig.fields.some(f => f.position?.rect),
            totalFields: schemaConfig.fields.length,
            fieldsWithPositions: schemaConfig.fields.filter(f => f.position?.rect).length,
            documentScale: schemaConfig.documentMetadata?.scale,
            canvasInfo: schemaConfig.documentMetadata?.canvasDimensions
        }));
        
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
        
        // Get document scale and dimensions for position calculations
        const documentMetadata = this.getDocumentMetadata();
        
        console.log('=== DOCUMENT EXTRACTION METADATA ===');
        console.log('Document scale:', documentMetadata.scale);
        console.log('Canvas dimensions:', documentMetadata.canvasDimensions);
        console.log('Total selections available:', this.selections.length);
        console.log('=====================================');
        
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
            
            // Find corresponding selection with position data
            const selection = this.selections.find(sel => sel.label === fieldName);
            if (selection) {
                // Add position and scale information for OpenAI extraction
                field.position = {
                    rect: {
                        x: selection.rect.x,
                        y: selection.rect.y,
                        width: selection.rect.width,
                        height: selection.rect.height
                    },
                    coordinates: {
                        startX: selection.startX,
                        startY: selection.startY,
                        endX: selection.endX,
                        endY: selection.endY
                    },
                    scale: documentMetadata.scale,
                    canvasDimensions: documentMetadata.canvasDimensions,
                    pageNumber: this.getFieldPageNumber(selection)
                };
                
                console.log(`Field "${fieldName}" position data:`, field.position);
            } else {
                console.warn(`No position data found for field: ${fieldName}`);
                // Add placeholder position data for fields without selections
                field.position = {
                    rect: null,
                    coordinates: null,
                    scale: documentMetadata.scale,
                    canvasDimensions: documentMetadata.canvasDimensions,
                    pageNumber: null,
                    note: "Field created without viewport selection"
                };
            }
            
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
        
        return { 
            fields,
            documentMetadata
        };
    }

    getDocumentMetadata() {
        // Get current canvas dimensions and scale information
        const canvas = this.canvas;
        const canvasDimensions = canvas ? {
            width: canvas.width,
            height: canvas.height,
            displayWidth: canvas.clientWidth,
            displayHeight: canvas.clientHeight
        } : null;
        
        // Get current scale information
        const scale = this.baseScale || 1;
        
        // Get PDF document information if available
        const pdfInfo = this.currentPDF ? {
            numPages: this.currentPDF.numPages,
            fingerprint: this.currentPDF.fingerprint
        } : null;
        
        return {
            scale: scale,
            canvasDimensions: canvasDimensions,
            pdfInfo: pdfInfo,
            currentPageNum: this.currentPageNum,
            timestamp: new Date().toISOString()
        };
    }

    getFieldPageNumber(selection) {
        // For now, return current page number
        // In a multi-page PDF, you might need more sophisticated logic
        // to determine which page the selection belongs to
        return this.currentPageNum || 1;
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
    // Use new UI logic for extraction results
    this.lastExtractionResults = results;
    this.switchToExtractedState();
    }

    switchToExtractedState() {
        // Store the original schema panel content for restoration
        const schemaPanel = document.querySelector('.extractor-schema-panel');
        if (!schemaPanel) return;
        
        // Store original content if not already stored
        if (!this.originalSchemaContent) {
            // Clear any data attributes before storing to ensure clean restoration
            const panelClone = schemaPanel.cloneNode(true);
            panelClone.querySelectorAll('[data-listener-attached]').forEach(el => {
                el.removeAttribute('data-listener-attached');
            });
            this.originalSchemaContent = panelClone.innerHTML;
            console.log('Stored original schema content for restoration');
        }
        
        // Replace the entire schema panel with extraction results UI
        this.replaceWithExtractionUI();
    }

    replaceWithExtractionUI() {
        const schemaPanel = document.querySelector('.extractor-schema-panel');
        if (!schemaPanel) return;
        
        // Create the new extraction results UI
        const extractionUI = `
            <div class="dashboard-card extraction-results-card">
                <div class="dashboard-title extraction-title">Extraction Results</div>
                <div class="extraction-subtitle">Document has been successfully processed</div>
                
                <!-- Extraction Results Container -->
                <div class="extraction-results-container">
                    <!-- Results will be populated here -->
                </div>
                
                <!-- Navigation Bar -->
                <div class="extractor-navigation-bar">
                    <button class="nav-btn nav-btn-secondary previous-btn">
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M19 12H5"/>
                            <path d="M12 19l-7-7 7-7"/>
                        </svg>
                        Previous
                    </button>
                    <button class="nav-btn nav-btn-primary next-btn">
                        Next
                        <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M5 12h14"/>
                            <path d="M12 5l7 7-7 7"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
        
        // Replace the content
        schemaPanel.innerHTML = extractionUI;
        
        // Add event listeners for navigation buttons
        const previousBtn = schemaPanel.querySelector('.previous-btn');
        const nextBtn = schemaPanel.querySelector('.next-btn');
        
        if (previousBtn) {
            previousBtn.addEventListener('click', () => this.handlePreviousStep());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNextStep());
        }
        
        // Now populate the results container with extracted data
        this.populateExtractionResults();
    }

    populateExtractionResults() {
        const resultsContainer = document.querySelector('.extraction-results-container');
        if (!resultsContainer || !this.lastExtractionResults) return;
        
        let resultsHTML = '';
        
        // Get schema field mapping
        const schemaMapping = this.getSchemaFieldMapping();
        
        // Process each field result
        Object.entries(this.lastExtractionResults).forEach(([fieldName, value]) => {
            if (fieldName === 'line_items' && Array.isArray(value)) {
                // Handle table data
                resultsHTML += this.createTableResultHTML(fieldName, value, schemaMapping);
            } else {
                // Handle regular fields
                resultsHTML += this.createFieldResultHTML(fieldName, value, schemaMapping);
            }
        });
        
        resultsContainer.innerHTML = resultsHTML;
    }

    createFieldResultHTML(fieldName, value, schemaMapping = {}) {
        // Use schema field name if available, otherwise format the fieldName
        const displayName = fieldName;
        const displayValue = value !== null && value !== undefined && value !== '' 
            ? String(value) 
            : 'No value extracted';
        
        const hasValue = value !== null && value !== undefined && value !== '';
        
        return `
            <div class="extraction-field-result ${hasValue ? 'has-value' : 'no-value'}">
                <div class="field-result-header">
                    <span class="field-result-name">${displayName}</span>
                </div>
                <div class="field-result-value">${displayValue}</div>
            </div>
        `;
    }

    createTableResultHTML(fieldName, tableData, schemaMapping = {}) {
        // Use schema field name if available, otherwise format the fieldName
        const displayName = fieldName;
        
        if (!Array.isArray(tableData) || tableData.length === 0) {
            return `
                <div class="extraction-field-result no-value">
                    <div class="field-result-header">
                        <span class="field-result-name">${displayName}</span>
                    </div>
                    <div class="field-result-value">No table data extracted</div>
                </div>
            `;
        }
        
        const tableHTML = this.createTableHTML(tableData);
        
        return `
            <div class="extraction-field-result has-value table-result">
                <div class="field-result-header">
                    <span class="field-result-name">${displayName}</span>
                </div>
                <div class="field-result-table">
                    ${tableHTML}
                </div>
            </div>
        `;
    }

    formatFieldName(fieldName) {
        // Convert field names to readable format
        return fieldName
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    getSchemaFieldMapping() {
        // Create mapping from original schema field names to display names
        const mapping = {};
        
        if (this.originalSchemaContent) {
            // Parse original schema content to get field names
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = this.originalSchemaContent;
            
            tempDiv.querySelectorAll('.extractor-field-row').forEach(fieldRow => {
                const fieldNameSpan = fieldRow.querySelector('.field-name');
                const fieldType = fieldRow.querySelector('.field-type-badge');
                
                if (fieldNameSpan && fieldType) {
                    const originalName = fieldNameSpan.textContent.trim();
                    const fieldTypeText = fieldType.textContent.trim().toLowerCase();
                    
                    // Map common field mappings
                    if (originalName.toLowerCase().includes('invoice') && originalName.toLowerCase().includes('number')) {
                        mapping['invoice_number'] = originalName;
                    }
                    if (originalName.toLowerCase().includes('date')) {
                        mapping['invoice_date'] = originalName;
                    }
                    if (originalName.toLowerCase().includes('total') || originalName.toLowerCase().includes('amount')) {
                        mapping['total_amount'] = originalName;
                    }
                    if (originalName.toLowerCase().includes('vendor') || originalName.toLowerCase().includes('supplier')) {
                        mapping['vendor_name'] = originalName;
                    }
                    if (fieldTypeText === 'table' || originalName.toLowerCase().includes('item') || originalName.toLowerCase().includes('line')) {
                        mapping['line_items'] = originalName;
                    }
                }
            });
        }
        
        return mapping;
    }

    addNavigationBar() {
        // Remove existing bottom bar
        const existingBottomBar = document.querySelector('.extractor-bottom-bar');
        if (existingBottomBar) {
            existingBottomBar.remove();
        }
        
        // Create navigation bar
        const navigationBar = document.createElement('div');
        navigationBar.className = 'extractor-navigation-bar';
        navigationBar.innerHTML = `
            <button class="nav-btn nav-btn-secondary previous-btn">
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M19 12H5"/>
                    <path d="M12 19l-7-7 7-7"/>
                </svg>
                Previous
            </button>
            <button class="nav-btn nav-btn-primary next-btn">
                Next
                <svg width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M5 12h14"/>
                    <path d="M12 5l7 7-7 7"/>
                </svg>
            </button>
        `;
        
        // Add to schema panel
        const schemaPanel = document.querySelector('.extractor-schema-panel');
        if (schemaPanel) {
            schemaPanel.appendChild(navigationBar);
        }
        
        // Add event listeners for navigation buttons
        const previousBtn = navigationBar.querySelector('.previous-btn');
        const nextBtn = navigationBar.querySelector('.next-btn');
        
        if (previousBtn) {
            previousBtn.addEventListener('click', () => this.handlePreviousStep());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.handleNextStep());
        }
    }

    handlePreviousStep() {
        // Return to schema editing mode
        this.switchToEditingState();
    }

    handleNextStep() {
        // Navigate to export UI (placeholder for now)
        alert('Export functionality will be implemented in the next phase.\n\nFeatures will include:\n- Export to JSON\n- Export to Excel\n- Export to CSV');
    }

    switchToEditingState() {
        // Restore the original schema panel content
        const schemaPanel = document.querySelector('.extractor-schema-panel');
        if (schemaPanel && this.originalSchemaContent) {
            console.log('Restoring original schema content...');
            schemaPanel.innerHTML = this.originalSchemaContent;
            
            // Wait for DOM to be ready, then re-initialize all event listeners
            setTimeout(() => {
                console.log('DOM restored, initializing event listeners...');
                this.initializeAllEventListeners();
            }, 100);
        }
        
        // Clear stored extraction results
        this.lastExtractionResults = null;
    }

    initializeAllEventListeners() {
        // Comprehensive event listener setup for restored content
        console.log('Initializing all event listeners...');
        
        // Log current DOM state
        const allFields = document.querySelectorAll('.extractor-field-row');
        const allActionButtons = document.querySelectorAll('.action-btn, .save-btn, .cancel-btn');
        console.log(`Found ${allFields.length} fields and ${allActionButtons.length} action buttons`);
        
        this.setupCoreEventListeners();
        this.setupFieldActionEvents();
        this.setupTableFieldEvents();
        this.setupRemoveColumnEvents();
        this.setupRealTimeFieldEditing();
        
        console.log('All event listeners reinitialized after restoration');
    }

    restoreBottomBar() {
        // Check if bottom bar already exists
        const existingBottomBar = document.querySelector('.extractor-bottom-bar');
        if (existingBottomBar) {
            return; // Already exists
        }
        
        // Create and add the original bottom bar
        const bottomBar = document.createElement('div');
        bottomBar.className = 'extractor-bottom-bar';
        bottomBar.innerHTML = `
            <button class="dashboard-btn dashboard-btn-primary">Extract Document</button>
        `;
        
        // Add event listener for extract button
        const extractBtn = bottomBar.querySelector('.dashboard-btn-primary');
        if (extractBtn) {
            extractBtn.addEventListener('click', (e) => this.handleExtract(e));
        }
        
        // Add to schema panel
        const schemaPanel = document.querySelector('.extractor-schema-panel');
        if (schemaPanel) {
            schemaPanel.appendChild(bottomBar);
        }
    }

    clearExtractionResults() {
        // Remove all field value displays
        document.querySelectorAll('.field-value-display').forEach(element => {
            element.remove();
        });
        
        // Remove all table value displays
        document.querySelectorAll('.table-value-display').forEach(element => {
            element.remove();
        });
    }

    populateFieldsWithResults(results) {
        // Iterate through all field rows and populate them with extracted data
        document.querySelectorAll('.extractor-field-row').forEach((fieldRow) => {
            const fieldNameElement = fieldRow.querySelector('.field-name');
            const fieldTypeElement = fieldRow.querySelector('.field-type-badge');
            
            if (!fieldNameElement || !fieldTypeElement) return;
            
            const fieldName = fieldNameElement.textContent.trim();
            const fieldType = fieldTypeElement.textContent.trim();
            
            // Check if we have data for this field
            if (results.hasOwnProperty(fieldName)) {
                const value = results[fieldName];
                
                if (fieldType === 'table') {
                    this.populateTableField(fieldRow, value);
                } else {
                    this.populateRegularField(fieldRow, value);
                }
            }
        });
    }

    populateRegularField(fieldRow, value) {
        // Find or create the field value display
        let valueDisplay = fieldRow.querySelector('.field-value-display');
        
        if (!valueDisplay) {
            // Create value display if it doesn't exist
            valueDisplay = document.createElement('div');
            valueDisplay.className = 'field-value-display';
            
            // Insert after the field description
            const fieldDescription = fieldRow.querySelector('.field-description');
            if (fieldDescription) {
                fieldDescription.parentNode.insertBefore(valueDisplay, fieldDescription.nextSibling);
            }
        }
        
        // Set the value
        if (value === null || value === undefined || value === '') {
            valueDisplay.innerHTML = '<span class="no-value">No value extracted</span>';
            valueDisplay.className = 'field-value-display no-value';
        } else {
            valueDisplay.textContent = String(value);
            valueDisplay.className = 'field-value-display has-value';
        }
    }

    populateTableField(fieldRow, tableData) {
        // Find or create the table value display
        let tableDisplay = fieldRow.querySelector('.table-value-display');
        
        if (!tableDisplay) {
            // Create table display if it doesn't exist
            tableDisplay = document.createElement('div');
            tableDisplay.className = 'table-value-display';
            
            // Insert after the table subfields
            const tableSubfields = fieldRow.querySelector('.table-subfields');
            if (tableSubfields) {
                tableSubfields.parentNode.insertBefore(tableDisplay, tableSubfields.nextSibling);
                       }
        }
        
        // Populate table data
        if (!Array.isArray(tableData) || tableData.length === 0) {
            tableDisplay.innerHTML = '<div class="no-table-data">No table data extracted</div>';
        } else {
            const tableHtml = this.createTableHTML(tableData);
            tableDisplay.innerHTML = tableHtml;
        }
        
        tableDisplay.className = 'table-value-display has-data';
    }

    createTableHTML(tableData) {
        if (!tableData || tableData.length === 0) {
            return '<div class="no-table-data">No data available</div>';
        }
        
        // Get headers from the first row
        const headers = Object.keys(tableData[0]);
        
        let html = '<div class="extracted-table-wrapper">';
        html += '<table class="extracted-table">';
        
        // Create header
        html += '<thead><tr>';
        headers.forEach(header => {
            html += `<th>${this.formatHeaderName(header)}</th>`;
        });
        html += '</tr></thead>';
        
        // Create body
        html += '<tbody>';
        tableData.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                const value = row[header];
                html += `<td>${value !== null && value !== undefined ? value : ''}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody>';
        
        html += '</table></div>';
        return html;
    }

    formatHeaderName(header) {
        // Convert camelCase or snake_case to readable format
        return header
            .replace(/_/g, ' ')
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    showExtractionSuccess() {
        // Show a success toast/notification
        const notification = document.createElement('div');
        notification.className = 'extraction-success-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <svg class="success-icon" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>Document extracted successfully!</span>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
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
                <div class="results-actions-bar">
                    <button class="dashboard-btn dashboard-btn-outline results-back-btn">Back</button>
                                       <button class="dashboard-btn dashboard-btn-primary results-next-btn" disabled>Next</button>
                </div>
            </div>
        `;
        // Add download functionality
        const downloadBtn = panel.querySelector('.download-btn');
        downloadBtn.addEventListener('click', () => this.downloadResults(results));
        // Add Back button functionality
        const backBtn = panel.querySelector('.results-back-btn');
        backBtn.addEventListener('click', () => this.handleResultsBack());
        // Next button reserved for export
        return panel;
    }
    handleResultsBack() {
        // Remove results panel and show schema panel for editing
        const resultsPanel = document.querySelector('.extractor-results-panel');
        if (resultsPanel) resultsPanel.remove();
        // Optionally scroll to schema panel
        const schemaPanel = document.querySelector('.extractor-schema-panel');
        if (schemaPanel) schemaPanel.scrollIntoView({ behavior: 'smooth' });
    }

    renderResultsContent(results) {
        let html = '';
        
        Object.entries(results).forEach(([fieldName, value]) => {
            html += `
                <div class="result-field">
                    <div class="result-field-header">
                        <strong>${fieldName}</strong>
                    </div>
                    <div class="result-field-value extracted-value">
                        ${this.formatResultValue(value)}
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    formatResultValue(value) {
        // Table/line item: render as table if array of objects
        if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
            const headers = Object.keys(value[0]);
            let table = '<table class="results-table"><thead><tr>';
            headers.forEach(h => {
                table += `<th>${h}</th>`;
            });
            table += '</tr></thead><tbody>';
            value.forEach(row => {
                table += '<tr>';
                headers.forEach(h => {
                    table += `<td>${row[h] ?? ''}</td>`;
                });
                table += '</tr>';
            });
            table += '</tbody></table>';
            return table;
        }
        // Simple value or array
        if (Array.isArray(value)) {
            return value.map(v => `<span>${v}</span>`).join(', ');
        }
        // Null/undefined fallback
        if (value === null || value === undefined) {
            return '<span style="color:#888">(no value)</span>';
        }
        // String/number
        return `<span>${value}</span>`;
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
            if (!select.hasAttribute('data-listener-attached')) {
                select.addEventListener('change', (e) => this.handleFieldTypeChange(e));
                select.setAttribute('data-listener-attached', 'true');
            }
        });

    // Add column button handler (removed to prevent double firing; handled per field editor)

        // Add subfield button handler
        document.querySelectorAll('.add-subfield-btn').forEach(btn => {
            if (!btn.hasAttribute('data-listener-attached')) {
                btn.addEventListener('click', (e) => this.handleAddSubfield(e));
                btn.setAttribute('data-listener-attached', 'true');
            }
        });

        this.setupRemoveColumnEvents();
    }

    setupTableFieldEventsForElement(element) {
        // Field type change handler for specific element
        const typeSelect = element.querySelector('.field-type-select');
        if (typeSelect) {
            typeSelect.addEventListener('change', (e) => this.handleFieldTypeChange(e));
        }

        // Add column button handler for specific element (remove previous listeners to prevent double firing)
        const addColumnBtn = element.querySelector('.add-column-btn');
        if (addColumnBtn) {
            addColumnBtn.replaceWith(addColumnBtn.cloneNode(true));
            const newAddColumnBtn = element.querySelector('.add-column-btn');
            if (newAddColumnBtn) {
                newAddColumnBtn.addEventListener('click', (e) => this.handleAddColumn(e));
            }
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
                typeSpan.style.setProperty('color', colors.color, 'important');
               //  typeSpan.style.background = colors.background;
            }
        }
    }

    setupRemoveColumnEvents() {
        document.querySelectorAll('.remove-column-btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });
        document.querySelectorAll('.remove-column-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleRemoveColumn(e));
        });

        document.querySelectorAll('.delete-subfield-btn').forEach(btn => {
            if (!btn.hasAttribute('data-listener-attached')) {
                btn.addEventListener('click', (e) => this.handleDeleteSubfield(e));
                btn.setAttribute('data-listener-attached', 'true');
            }
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
        // Clear any existing duplicate listeners by cloning and replacing elements
        this.clearDuplicateListeners();
        
        // Re-setup all core event listeners
        this.setupCoreEventListeners();
        this.setupFieldActionEvents();
        this.setupRemoveColumnEvents();
        this.setupTableFieldEvents();
        this.setupRealTimeFieldEditing();
    }

    clearDuplicateListeners() {
        // Clone and replace elements to remove all existing event listeners
        const elementsToClone = [
            '.extractor-add-field-btn',
            '.extractor-bottom-bar .dashboard-btn-primary',
            '.field-name-input',
            '.field-desc-input'
        ];

        elementsToClone.forEach(selector => {
            document.querySelectorAll(selector).forEach(element => {
                if (element.parentNode) {
                    const newElement = element.cloneNode(true);
                    element.parentNode.replaceChild(newElement, element);
                }
            });
        });
    }

    setupCoreEventListeners() {
        // Add field button
        const addFieldBtn = document.querySelector('.extractor-add-field-btn');
        if (addFieldBtn && !addFieldBtn.hasAttribute('data-listener-attached')) {
            addFieldBtn.addEventListener('click', (e) => this.handleAddField(e));
            addFieldBtn.setAttribute('data-listener-attached', 'true');
        }

        // Extract button
        const extractBtn = document.querySelector('.extractor-bottom-bar .dashboard-btn-primary');
        if (extractBtn && !extractBtn.hasAttribute('data-listener-attached')) {
            extractBtn.addEventListener('click', (e) => this.handleExtract(e));
            extractBtn.setAttribute('data-listener-attached', 'true');
        }
    }

    setupFieldActionEvents() {
        // Field action buttons (edit, save, cancel, remove) 
        const buttons = document.querySelectorAll('.action-btn, .save-btn, .cancel-btn');
        console.log(`Setting up field action events for ${buttons.length} buttons`);
        
        buttons.forEach((btn, index) => {
            // For restored content, always attach fresh listeners
            // Use a more direct approach: remove existing listeners by cloning only for restored content
            if (!btn.hasAttribute('data-listener-attached')) {
                console.log(`Attaching listener to button ${index} (${btn.dataset.action})`);
                
                // Create a wrapper function to ensure 'this' context is preserved
                const clickHandler = (e) => {
                    console.log(`Button clicked: ${btn.dataset.action} for field ${btn.dataset.idx}`);
                    this.handleFieldAction(e);
                };
                
                btn.addEventListener('click', clickHandler);
                btn.setAttribute('data-listener-attached', 'true');
            } else {
                console.log(`Button ${index} already has listener attached`);
            }
        });
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
