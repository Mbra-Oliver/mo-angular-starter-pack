import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  HostListener,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  FormControl,
  FormsModule,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ReactiveFormsModule,
  ValidationErrors,
  Validator,
  Validators,
} from '@angular/forms';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
  group?: string;
  description?: string;
  icon?: string;
}

export type SelectSize = 'sm' | 'md' | 'lg';
export type SelectVariant = 'default' | 'outlined' | 'filled';

@Component({
  selector: 'mo-select',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => Select),
      multi: true,
    },
  ],
  templateUrl: './select.html',
  styleUrl: './select.css',
})
export class Select implements ControlValueAccessor, Validator {
  @ViewChild('selectContainer') selectContainer!: ElementRef;
  @ViewChild('selectButton') selectButton!: ElementRef;
  @ViewChild('searchInput') searchInput!: ElementRef;

  // === INPUTS avec signals ===
  label = input<string>('');
  placeholder = input<string>('Sélectionner...');
  options = input<SelectOption[]>([]);
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  clearable = input<boolean>(false);
  searchable = input<boolean>(false);
  multiple = input<boolean>(false);

  // Apparence
  size = input<SelectSize>('md');
  variant = input<SelectVariant>('default');

  // Configuration
  hintText = input<string>();
  maxSelections = input<number>();
  closeOnSelect = input<boolean>(true);

  // === SIGNALS internes ===
  isOpen = signal<boolean>(false);
  searchTerm = signal<string>('');
  focusedIndex = signal<number>(-1);
  dropdownUp = signal<boolean>(false);
  selectedValues = signal<any[]>([]);

  // === COMPUTED SIGNALS ===
  selectedOptions = computed(() => {
    return this.options().filter((option) =>
      this.selectedValues().includes(option.value)
    );
  });

  filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    if (!term) return this.options();

    return this.options().filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.description?.toLowerCase().includes(term)
    );
  });

  groupedOptions = computed(() => {
    const groups = new Map<string, SelectOption[]>();

    this.filteredOptions().forEach((option) => {
      const groupName = option.group || '';
      if (!groups.has(groupName)) {
        groups.set(groupName, []);
      }
      groups.get(groupName)!.push(option);
    });

    return Array.from(groups.entries()).map(([name, options]) => ({
      name,
      options,
    }));
  });

  selectClasses = computed(() => {
    const baseClasses =
      'flex items-center w-full border rounded-[8px] transition-all duration-200 cursor-pointer focus:outline-none ';

    const sizeClasses = {
      sm: 'px-2 py-1 text-sm',
      md: 'px-3 py-2',
      lg: 'px-4 py-3 text-lg',
    };

    const variantClasses = {
      default: 'border-gray-300 bg-white ',
      outlined: 'border-2 border-gray-300 bg-white ',
      filled: 'border-transparent bg-gray-50 focus:bg-white ',
    };

    let classes = `${baseClasses} ${sizeClasses[this.size()]} ${
      variantClasses[this.variant()]
    }`;

    // États
    if (this.control.touched && this.control.errors) {
      classes += ' border-red-500 focus:ring-red-500';
    }
    if (this.readonly() || this.disabled()) {
      classes += ' bg-gray-100 cursor-not-allowed opacity-60';
    }
    if (this.isOpen()) {
      classes +=
        ' ring-0 focus:ring-0 focus:outline-none focus:border-2 border-gray-200';
    }

    return classes;
  });

  // === PROPRIÉTÉS ===
  control = new FormControl(this.multiple() ? [] : null);

  // ControlValueAccessor callbacks
  onChange = (value: any) => {};
  onTouched = () => {};

  constructor() {
    // Effect pour mettre à jour la valeur du control
    effect(() => {
      const value = this.multiple()
        ? this.selectedValues()
        : this.selectedValues()[0] || null;
      this.control.setValue(value, { emitEvent: false });
    });

    // Effect pour la validation
    effect(() => {
      this.updateValidators();
    });

    // Effect pour gérer l'état disabled
    effect(() => {
      if (this.disabled()) {
        this.control.disable();
      } else {
        this.control.enable();
      }
    });

    // Effect pour fermer le dropdown lors du changement de mode
    effect(() => {
      if (this.multiple() && this.closeOnSelect()) {
        // En mode multiple, ne pas fermer automatiquement
      }
    });
  }

  // === MÉTHODES CVA ===
  writeValue(value: any): void {
    if (this.multiple()) {
      this.selectedValues.set(Array.isArray(value) ? value : []);
    } else {
      this.selectedValues.set(value !== null ? [value] : []);
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    // Géré par l'effect
  }

  // === VALIDATION ===
  validate(c: AbstractControl): ValidationErrors | null {
    return this.control.errors;
  }

  private updateValidators(): void {
    const validators = [];

    if (this.required()) {
      validators.push(Validators.required);
    }

    this.control.setValidators(validators);
    this.control.updateValueAndValidity({ emitEvent: false });
  }

  // === MÉTHODES PUBLIQUES ===
  toggleDropdown(): void {
    if (this.readonly() || this.disabled()) return;

    if (this.isOpen()) {
      this.closeDropdown();
    } else {
      this.openDropdown();
    }
  }

  openDropdown(): void {
    if (this.readonly() || this.disabled()) return;

    this.isOpen.set(true);
    this.focusedIndex.set(-1);
    this.onTouched();

    // Calculer la position du dropdown
    setTimeout(() => {
      this.calculateDropdownPosition();
      if (this.searchable() && this.searchInput) {
        this.searchInput.nativeElement.focus();
      }
    });
  }

  closeDropdown(): void {
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.focusedIndex.set(-1);
    this.selectButton.nativeElement.focus();
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    const currentValues = this.selectedValues();

    if (this.multiple()) {
      if (this.isSelected(option)) {
        // Désélectionner
        const newValues = currentValues.filter((v) => v !== option.value);
        this.selectedValues.set(newValues);
        this.onChange(newValues);
      } else {
        // Sélectionner (vérifier le maximum)
        const maxSelections = this.maxSelections() ?? undefined;
        if (
          maxSelections === undefined ||
          currentValues.length < maxSelections
        ) {
          const newValues = [...currentValues, option.value];
          this.selectedValues.set(newValues);
          this.onChange(newValues);
        }
      }

      // En mode multiple, garder le dropdown ouvert sauf si closeOnSelect est true
      if (this.closeOnSelect()) {
        this.closeDropdown();
      } else {
        this.focusedIndex.set(-1);
      }
    } else {
      // Mode simple
      this.selectedValues.set([option.value]);
      this.onChange(option.value);
      this.closeDropdown();
    }
  }

  removeOption(event: Event, option: SelectOption): void {
    event.stopPropagation();
    const newValues = this.selectedValues().filter((v) => v !== option.value);
    this.selectedValues.set(newValues);
    this.onChange(this.multiple() ? newValues : null);
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.selectedValues.set([]);
    this.onChange(this.multiple() ? [] : null);
  }

  isSelected(option: SelectOption): boolean {
    return this.selectedValues().includes(option.value);
  }

  hasError(code: string): boolean {
    return this.control.touched && this.control.hasError(code);
  }

  getOptionIndex(option: SelectOption): number {
    return this.filteredOptions().findIndex((o) => o.value === option.value);
  }

  setFocusedIndex(index: number): void {
    this.focusedIndex.set(index);
  }

  // === GESTIONNAIRES D'ÉVÉNEMENTS ===
  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.focusedIndex.set(-1);
  }

  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case ' ':
      case 'Enter':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown();
        } else {
          const focusedOption = this.filteredOptions()[this.focusedIndex()];
          if (focusedOption) {
            this.selectOption(focusedOption);
          }
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;

      case 'ArrowDown':
        event.preventDefault();
        if (!this.isOpen()) {
          this.openDropdown();
        } else {
          this.moveFocus(1);
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveFocus(-1);
        }
        break;

      case 'Tab':
        if (this.isOpen()) {
          this.closeDropdown();
        }
        break;
    }
  }

  onSearchKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveFocus(1);
        break;

      case 'ArrowUp':
        event.preventDefault();
        this.moveFocus(-1);
        break;

      case 'Enter':
        event.preventDefault();
        const focusedOption = this.filteredOptions()[this.focusedIndex()];
        if (focusedOption) {
          this.selectOption(focusedOption);
        }
        break;

      case 'Escape':
        event.preventDefault();
        this.closeDropdown();
        break;
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (
      this.isOpen() &&
      this.selectContainer &&
      !this.selectContainer.nativeElement.contains(event.target)
    ) {
      this.closeDropdown();
    }
  }

  // === MÉTHODES UTILITAIRES ===
  private moveFocus(direction: number): void {
    const options = this.filteredOptions();
    if (options.length === 0) return;

    let newIndex = this.focusedIndex() + direction;

    if (newIndex < 0) {
      newIndex = options.length - 1;
    } else if (newIndex >= options.length) {
      newIndex = 0;
    }

    this.focusedIndex.set(newIndex);
  }

  private calculateDropdownPosition(): void {
    if (!this.selectContainer) return;

    const rect = this.selectContainer.nativeElement.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Si pas assez d'espace en bas et plus d'espace en haut
    this.dropdownUp.set(spaceBelow < 200 && spaceAbove > spaceBelow);
  }
}
