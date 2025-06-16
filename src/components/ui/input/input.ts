import { CommonModule } from '@angular/common';
import {
  Component,
  computed,
  effect,
  forwardRef,
  input,
  signal,
} from '@angular/core';
import {
  FormsModule,
  ReactiveFormsModule,
  NG_VALUE_ACCESSOR,
  NG_VALIDATORS,
  ControlValueAccessor,
  Validator,
  FormControl,
  AbstractControl,
  ValidationErrors,
  Validators,
} from '@angular/forms';

export type InputType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'tel'
  | 'url'
  | 'search'
  | 'date'
  | 'time'
  | 'datetime-local'
  | 'month'
  | 'week'
  | 'color'
  | 'range'
  | 'file';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputVariant = 'default' | 'outlined' | 'filled';

@Component({
  selector: 'mo-input',
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => Input),
      multi: true,
    },
  ],
  templateUrl: './input.html',
  styleUrl: './input.css',
})
export class Input implements ControlValueAccessor, Validator {
  // === INPUTS avec signals ===
  label = input<string>('');
  type = input<InputType>('text');
  placeholder = input<string>('');
  required = input<boolean>(false);
  readonly = input<boolean>(false);
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  clearable = input<boolean>(false);

  // Validation
  minLength = input<number>();
  maxLength = input<number>();
  min = input<number | string>();
  max = input<number | string>();
  step = input<number | string>();
  pattern = input<string>();
  patternErrorMessage = input<string>();

  // Apparence
  size = input<InputSize>('md');
  variant = input<InputVariant>('default');
  prefixIcon = input<string>();
  suffixIcon = input<string>();

  // Attributs HTML
  autocomplete = input<string>();
  spellcheck = input<boolean>(true);
  accept = input<string>(); // pour type="file"
  multiple = input<boolean>(false); // pour type="file"

  // Configuration
  hintText = input<string>();
  showCharacterCount = input<boolean>(false);
  numbersOnly = input<boolean>(false); // pour forcer seulement les nombres
  maxFileSize = input<number>(10); // en MB pour type="file"
  allowedFileTypes = input<string[]>(); // pour type="file"

  // === SIGNALS internes ===
  isPasswordVisible = signal<boolean>(false);

  // === COMPUTED SIGNALS ===
  inputType = computed(() => {
    if (this.type() === 'password') {
      return this.isPasswordVisible() ? 'text' : 'password';
    }
    return this.type();
  });

  inputClasses = computed(() => {
    const baseClasses =
      'input input-bordered bg-white w-full focus:border-0 transition-all duration-200';
    const sizeClasses = {
      sm: 'p-2 text-sm',
      md: 'p-3',
      lg: 'p-4 text-lg',
    };
    const variantClasses = {
      default: 'border-gray-300 focus:ring-2 focus:ring-primary',
      outlined: 'border-2 border-gray-300 focus:border-primary',
      filled:
        'bg-gray-50 border-transparent focus:bg-white focus:ring-2 focus:ring-primary',
    };

    let classes = `${baseClasses} ${sizeClasses[this.size()]} ${
      variantClasses[this.variant()]
    }`;

    // Padding pour les icônes
    if (this.prefixIcon()) classes += ' pl-10';
    if (
      this.suffixIcon() ||
      this.type() === 'password' ||
      this.clearable() ||
      this.loading()
    ) {
      classes += ' pr-10';
    }

    // États
    if (this.control.touched && this.control.errors) {
      classes += ' border-red-500 focus:ring-red-500';
    }
    if (this.readonly()) {
      classes += ' bg-gray-100 cursor-not-allowed';
    }

    return classes;
  });

  // === PROPRIÉTÉS ===
  control = new FormControl('');

  // ControlValueAccessor callbacks
  onChange = (value: any) => {};
  onTouched = () => {};

  constructor() {
    // Effect pour gérer la validation dynamique
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
  }

  // === MÉTHODES CVA ===
  writeValue(value: any): void {
    this.control.setValue(value, { emitEvent: false });
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
    this.control.valueChanges.subscribe(fn);
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean) {
    isDisabled ? this.control.disable() : this.control.enable();
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

    if (this.minLength()) {
      validators.push(Validators.minLength(this.minLength()!));
    }

    if (this.maxLength()) {
      validators.push(Validators.maxLength(this.maxLength()!));
    }

    if (this.min()) {
      validators.push(Validators.min(Number(this.min())));
    }

    if (this.max()) {
      validators.push(Validators.max(Number(this.max())));
    }

    if (this.pattern()) {
      validators.push(Validators.pattern(this.pattern()!));
    }

    // Validations par type
    switch (this.type()) {
      case 'email':
        validators.push(Validators.email);
        break;
      case 'url':
        validators.push(this.urlValidator);
        break;
      case 'number':
        validators.push(this.numberValidator);
        break;
      case 'tel':
        validators.push(this.phoneValidator);
        break;
    }

    this.control.setValidators(validators);
    this.control.updateValueAndValidity({ emitEvent: false });
  }

  // === VALIDATEURS PERSONNALISÉS ===
  private urlValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    try {
      new URL(control.value);
      return null;
    } catch {
      return { url: true };
    }
  }

  private numberValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const isNumber =
      !isNaN(Number(control.value)) && isFinite(Number(control.value));
    return isNumber ? null : { number: true };
  }

  private phoneValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) return null;
    const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
    return phoneRegex.test(control.value) ? null : { tel: true };
  }

  // === GESTIONNAIRES D'ÉVÉNEMENTS ===
  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;

    // Filtrage pour type number avec numbersOnly
    if (this.type() === 'number' || this.numbersOnly()) {
      const value = target.value;
      const numericValue = value.replace(/[^0-9.-]/g, '');
      if (value !== numericValue) {
        target.value = numericValue;
        this.control.setValue(numericValue);
      }
    }

    // Validation de fichier
    if (this.type() === 'file') {
      this.validateFile(target.files);
    }
  }

  onKeydown(event: KeyboardEvent): void {
    // Prévenir la saisie de caractères non numériques pour type number
    if (this.type() === 'number' || this.numbersOnly()) {
      const target = event.currentTarget;

      if (!(target instanceof HTMLInputElement)) {
        return;
      }

      const allowedKeys = [
        'Backspace',
        'Delete',
        'Tab',
        'Escape',
        'Enter',
        'Home',
        'End',
        'ArrowLeft',
        'ArrowRight',
        'Clear',
        'Copy',
        'Paste',
      ];
      const isNumber = /[0-9]/.test(event.key);
      const isDecimal = event.key === '.' && !target.value.includes('.');
      const isMinus = event.key === '-' && target.value.length === 0;

      if (
        !allowedKeys.includes(event.key) &&
        !isNumber &&
        !isDecimal &&
        !isMinus
      ) {
        event.preventDefault();
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    if (this.type() === 'number' || this.numbersOnly()) {
      const paste = event.clipboardData?.getData('text') || '';
      if (!/^-?\d*\.?\d*$/.test(paste)) {
        event.preventDefault();
      }
    }
  }

  // === MÉTHODES UTILITAIRES ===
  togglePasswordVisibility(): void {
    this.isPasswordVisible.update((visible) => !visible);
  }

  clearValue(): void {
    this.control.setValue('');
    this.control.markAsTouched();
  }

  hasError(code: string): boolean {
    return this.control.touched && this.control.hasError(code);
  }

  private validateFile(files: FileList | null): void {
    if (!files || files.length === 0) return;

    const file = files[0];
    const errors: ValidationErrors = {};

    // Validation de la taille
    const maxSize = this.maxFileSize() * 1024 * 1024; // Convert to bytes
    if (file.size > maxSize) {
      errors['file-size'] = true;
    }

    // Validation du type
    if (this.allowedFileTypes()?.length) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (!fileExtension || !this.allowedFileTypes()!.includes(fileExtension)) {
        errors['file-type'] = true;
      }
    }

    // Appliquer les erreurs
    if (Object.keys(errors).length > 0) {
      this.control.setErrors({ ...this.control.errors, ...errors });
    }
  }

  // === MÉTHODES PUBLIQUES ===
  focus(): void {
    // Vous pouvez utiliser ViewChild pour obtenir une référence à l'input
    // Pour l'instant, cette méthode est un placeholder
  }

  blur(): void {
    this.onTouched();
  }

  reset(): void {
    this.control.reset();
  }
}
