import {
  Component,
  computed,
  ElementRef,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
export type SearchSize = 'sm' | 'md' | 'lg';
export type SearchVariant = 'default' | 'outlined' | 'filled';

@Component({
  selector: 'mo-search',
  imports: [],
  templateUrl: './search.html',
  styleUrl: './search.css',
})
export class Search {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  // === INPUTS ===
  placeholder = input<string>('Rechercher...');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  size = input<SearchSize>('md');
  variant = input<SearchVariant>('default');
  fullWidth = input<boolean>(false);
  value = input<string>('');

  // Apparence
  showClearButton = input<boolean>(true);
  showSearchButton = input<boolean>(false);
  showResultsCount = input<boolean>(false);

  // Icônes personnalisées
  customSearchIcon = input<string>('');
  customClearIcon = input<string>('');
  customSearchButtonIcon = input<string>('');

  // Textes et accessibilité
  helperText = input<string>('');
  ariaLabel = input<string>('');
  resultsCount = input<number>(0);

  // Suggestions rapides
  quickSuggestions = input<
    Array<{ label: string; value: string; icon?: string }>
  >([]);

  // === OUTPUTS ===
  search = output<string>(); // Émis uniquement sur Entrée ou clic sur bouton recherche
  valueChange = output<string>(); // Émis à chaque changement (pour binding)
  focus = output<void>();
  blur = output<void>();
  clear = output<void>();
  suggestionSelected = output<{
    label: string;
    value: string;
    icon?: string;
  }>();

  // === SIGNALS ===
  localValue = signal('');
  focused = signal(false);
  lastSearchValue = signal(''); // Garde en mémoire la dernière recherche effectuée

  // === COMPUTED CLASSES ===
  containerClasses = computed(() => {
    const classes = ['relative'];
    if (this.fullWidth()) {
      classes.push('w-full');
    }
    return classes.join(' ');
  });

  inputContainerClasses = computed(() => {
    return 'relative flex items-center';
  });

  inputClasses = computed(() => {
    const baseClasses = [
      'w-full',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-0', // supprime le ring bleu par défaut
      'focus:border-gray-300', // bordure grise au focus
      'disabled:opacity-50',
      'transition-colors',
      'text-black', // texte saisi en noir pur
      'placeholder:text-gray-400', // placeholder en noir pur
    ];

    // Taille
    const sizeClasses = this.getSizeClasses();

    // Variante
    const variantClasses = this.getVariantClasses();

    // Padding en fonction des icônes
    const paddingClasses = this.getPaddingClasses();

    // État désactivé
    const disabledClasses = this.disabled()
      ? ['bg-gray-50', 'text-gray-500', 'cursor-not-allowed']
      : [];

    return [
      ...baseClasses,
      ...sizeClasses,
      ...variantClasses,
      ...paddingClasses,
      ...disabledClasses,
    ].join(' ');
  });

  iconClasses = computed(() => {
    const size = this.size();
    const sizeMap = {
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
    };
    return `${sizeMap[size]} text-gray-400`;
  });

  clearButtonClasses = computed(() => {
    const baseClasses = [
      'absolute',
      'top-1/2',
      'transform',
      '-translate-y-1/2',
      'text-gray-400',
      'hover:text-gray-600',
      'transition-colors',
      'focus:outline-none',
      'focus:text-gray-600',
    ];

    const rightPosition = this.showSearchButton() ? 'right-10' : 'right-3';
    baseClasses.push(rightPosition);

    return baseClasses.join(' ');
  });

  searchButtonClasses = computed(() => {
    const baseClasses = [
      'absolute',
      'right-2',
      'top-1/2',
      'transform',
      '-translate-y-1/2',
      'px-2',
      'py-1',
      'text-white',
      'bg-primary',
      'hover:bg-green-700',
      'disabled:bg-gray-400',
      'disabled:cursor-not-allowed',
      'rounded',
      'transition-colors',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary',
      'focus:ring-offset-1',
    ];

    return baseClasses.join(' ');
  });

  // === MÉTHODES ===
  onInputChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.localValue.set(target.value);
    this.valueChange.emit(target.value);
  }

  onEnterPressed() {
    this.performSearch();
  }

  onFocus() {
    this.focused.set(true);
    this.focus.emit();
  }

  onBlur() {
    this.focused.set(false);
    this.blur.emit();
  }

  performSearch() {
    const value = this.localValue().trim();
    if (value) {
      this.lastSearchValue.set(value);
      this.search.emit(value);
    }
  }

  clearSearch() {
    this.localValue.set('');
    this.lastSearchValue.set('');
    this.valueChange.emit('');
    this.clear.emit();
    this.searchInput?.nativeElement.focus();
  }

  selectSuggestion(suggestion: {
    label: string;
    value: string;
    icon?: string;
  }) {
    this.localValue.set(suggestion.value);
    this.lastSearchValue.set(suggestion.value);
    this.valueChange.emit(suggestion.value);
    this.suggestionSelected.emit(suggestion);
    this.search.emit(suggestion.value);
    this.focused.set(false);
  }

  // Méthode publique pour définir la valeur depuis l'extérieur
  setValue(value: string) {
    this.localValue.set(value);
  }

  // Méthode publique pour obtenir la valeur actuelle
  getValue(): string {
    return this.localValue();
  }

  // Méthode publique pour focus programmatique
  focusInput() {
    this.searchInput?.nativeElement.focus();
  }

  private getSizeClasses(): string[] {
    const size = this.size();
    const sizes = {
      sm: ['py-1.5', 'text-sm'],
      md: ['py-2', 'text-sm'],
      lg: ['py-3', 'text-base'],
    };
    return sizes[size];
  }

  private getVariantClasses(): string[] {
    const variant = this.variant();
    const variants = {
      default: ['border', 'border-gray-300', 'rounded-lg', 'bg-white'],
      outlined: ['border-2', 'border-gray-300', 'rounded-lg', 'bg-white'],
      filled: [
        'border',
        'border-gray-200',
        'rounded-lg',
        'bg-gray-50',
        'focus:bg-white',
      ],
    };
    return variants[variant];
  }

  private getPaddingClasses(): string[] {
    const hasSearchButton = this.showSearchButton();
    const hasClearButton = this.showClearButton();

    let leftPadding = 'pl-10'; // Pour l'icône de recherche
    let rightPadding = 'pr-4';

    if (hasSearchButton) {
      rightPadding = 'pr-16';
    } else if (hasClearButton) {
      rightPadding = 'pr-10';
    }

    return [leftPadding, rightPadding];
  }
}
