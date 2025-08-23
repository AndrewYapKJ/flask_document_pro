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

        // Extract button
        const extractBtn = document.querySelector('.extractor-bottom-bar .dashboard-btn-primary');
        if (extractBtn) {
            extractBtn.addEventListener('click', (e) => this.handleExtract(e));
        }

        // Setup real-time field editing
        this.setupRealTimeFieldEditing();
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
    }

    saveField(field, editor, idx) {
        // Update field display with the edited values
        this.updateFieldDisplay(field, editor);
        
        field.classList.remove('expanded');
        editor.style.display = 'none';

        // If this is a table field, ensure subfields are visible
        const fieldTypeSelect = editor.querySelector('.field-type-select');
        const tableSubfields = field.querySelector('.table-subfields');

        if (fieldTypeSelect?.value === 'table' && tableSubfields) {
            tableSubfields.style.display = 'block';
            field.classList.add('table-field');

            // Sync all table display elements
            const tableColumns = field.querySelectorAll('.table-column-row');
            tableColumns.forEach(columnRow => {
                const nameInput = columnRow.querySelector('.column-name-input');
                if (nameInput) {
                    this.updateTableDisplay(nameInput);
                }
            });
        }

        console.log('Saving field:', idx);
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

    handleExtract(e) {
        e.preventDefault();
        console.log('Extract document functionality would go here');
        alert('Extract document functionality not implemented yet');
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
        const fieldTypeSpan = fieldRow.querySelector('span[style*="border-radius:12px"]');
        const tableSubfields = fieldRow.querySelector('.table-subfields');

        // Update the field type display
        if (fieldTypeSpan) {
            this.updateFieldTypeDisplay(fieldTypeSpan, select.value);
        }

        // Show/hide table configuration and subfields
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
        const fieldRow = e.target.closest('.extractor-field-row');
        const tableColumns = fieldEditor.querySelector('.table-columns');
        const subfieldsContainer = fieldRow.querySelector('.subfields-container');
        const addSubfieldBtn = subfieldsContainer?.querySelector('.add-subfield-btn');
        
        // Create new column configuration row in edit mode
        const newColumnHtml = this.createColumnConfigHtml();
        tableColumns.insertAdjacentHTML('beforeend', newColumnHtml);
        
        // Create corresponding display element in display mode
        if (addSubfieldBtn) {
            const newSubfieldHtml = this.createSubfieldHtml();
            addSubfieldBtn.insertAdjacentHTML('beforebegin', newSubfieldHtml);
        }
        
        // Add event listeners to the newly created elements only
        const newColumnRow = tableColumns.querySelector('.table-column-row:last-child');
        if (newColumnRow) {
            // Add event listener to the remove button
            const removeBtn = newColumnRow.querySelector('.remove-column-btn');
            if (removeBtn) {
                removeBtn.addEventListener('click', (e) => this.handleRemoveColumn(e));
            }
        }
        
        // Add event listener to the new subfield delete button if it exists
        if (subfieldsContainer) {
            const newSubfieldWrapper = subfieldsContainer.querySelector('.subfield-wrapper:last-of-type');
            if (newSubfieldWrapper) {
                const deleteBtn = newSubfieldWrapper.querySelector('.delete-subfield-btn');
                if (deleteBtn) {
                    deleteBtn.addEventListener('click', (e) => this.handleDeleteSubfield(e));
                }
            }
        }
        
        this.applyThemeStyles();
        
        // Trigger immediate sync to update display
        setTimeout(() => {
            const newNameInput = tableColumns.querySelector('.table-column-row:last-child .column-name-input');
            if (newNameInput) {
                this.updateTableDisplay(newNameInput);
            }
        }, 100);
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
                    <input type="text" class="form-control column-name-input" value="new_column" onchange="extractorManager.updateTableDisplay(this)">
                    <label class="column-label">Description</label>
                    <input type="text" class="form-control column-description-input" value="New table column description" onchange="extractorManager.updateTableDisplay(this)">
                </div>
                <div class="column-type-group">
                    <label class="column-label">Type</label>
                    <select class="form-control column-type-select" onchange="extractorManager.updateTableDisplay(this)">
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
                typeSpan.style.background = colors.background;
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
                span.style.background = colors.background + ' !important';
                span.style.color = colors.color + ' !important';
            }
        });

        // Update subfield type spans
        document.querySelectorAll('.subfield-type').forEach(span => {
            const text = span.textContent.toLowerCase();
            const colors = this.getTypeColors(text, isDark);
            if (colors) {
                span.style.background = colors.background + ' !important';
                span.style.setProperty('color', colors.color, 'important');
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
