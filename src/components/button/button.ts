import { Component, computed, input, output } from '@angular/core';
export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'success'
  | 'warning'
  | 'danger'
  | 'ghost'
  | 'blue'
  | 'outline';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type ButtonIconPosition = 'left' | 'right' | 'only';

@Component({
  selector: 'mo-button',
  imports: [],
  templateUrl: './button.html',
  styleUrl: './button.css',
})
export class Button {
  // === INPUTS ===
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  fullWidth = input<boolean>(false);
  rounded = input<boolean>(false);

  // Icônes
  icon = input<string>(''); // SVG string
  iconUrl = input<string>(''); // URL de l'image
  iconAlt = input<string>('');
  iconPosition = input<ButtonIconPosition>('left');

  // Texte et accessibilité
  label = input<string>(''); // Pour aria-label quand icon only

  // Badge de notification
  badge = input<number | null>(null);

  // === OUTPUTS ===
  click = output<Event>();

  // === COMPUTED CLASSES ===
  buttonClasses = computed(() => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'transition-all',
      'duration-200',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'relative',
      'select-none',
    ];

    // Taille
    const sizeClasses = this.getSizeClasses();

    // Variante de couleur
    const variantClasses = this.getVariantClasses();

    // Forme
    const shapeClasses = this.getShapeClasses();

    // Largeur
    const widthClasses = this.fullWidth() ? ['w-full'] : [];

    // État désactivé
    const disabledClasses =
      this.disabled() || this.loading()
        ? ['cursor-not-allowed', 'opacity-60']
        : ['hover:scale-105', 'active:scale-95'];

    return [
      ...baseClasses,
      ...sizeClasses,
      ...variantClasses,
      ...shapeClasses,
      ...widthClasses,
      ...disabledClasses,
    ].join(' ');
  });

  iconClasses = computed(() => {
    const position = this.iconPosition();
    const hasText = position !== 'only';

    if (position === 'left' && hasText) {
      return 'w-4 h-4 mr-2';
    } else if (position === 'right' && hasText) {
      return 'w-4 h-4 ml-2';
    }
    return 'w-4 h-4';
  });

  iconOnlyClasses = computed(() => {
    const size = this.size();
    const sizeMap = {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-7 h-7',
    };
    return sizeMap[size];
  });

  textClasses = computed(() => {
    return this.loading() ? 'ml-1' : '';
  });

  badgeClasses = computed(() => {
    return [
      'absolute',
      '-top-2',
      '-right-2',
      'min-w-[1.25rem]',
      'h-5',
      'flex',
      'items-center',
      'justify-center',
      'text-xs',
      'font-bold',
      'text-white',
      'bg-red-500',
      'rounded-full',
      'px-1',
    ].join(' ');
  });

  // === MÉTHODES ===
  handleClick(event: Event) {
    if (!this.disabled() && !this.loading()) {
      this.click.emit(event);
    }
  }

  onIconError(event: any) {
    console.warn("Erreur de chargement de l'icône:", event.target.src);
    event.target.style.display = 'none';
  }

  private getSizeClasses(): string[] {
    const size = this.size();
    const iconOnly = this.iconPosition() === 'only';

    if (iconOnly) {
      const iconOnlySizes = {
        xs: ['p-1', 'text-xs'],
        sm: ['p-1.5', 'text-sm'],
        md: ['p-2', 'text-base'],
        lg: ['p-2.5', 'text-lg'],
        xl: ['p-3', 'text-xl'],
      };
      return iconOnlySizes[size];
    }

    const sizes = {
      xs: ['px-2', 'py-1', 'text-xs'],
      sm: ['px-3', 'py-1.5', 'text-sm'],
      md: ['px-4', 'py-2', 'text-sm'],
      lg: ['px-6', 'py-3', 'text-base'],
      xl: ['px-8', 'py-4', 'text-lg'],
    };

    return sizes[size];
  }

  private getVariantClasses(): string[] {
    const variant = this.variant();

    const variants = {
      primary: [
        'bg-primary',
        'text-white',
        'border-transparent',
        'hover:bg-green-700',
        'focus:ring-green-500',
        'disabled:bg-primary',
        'disabled:!opacity-25',
        'disabled:!cursor-not-allowed',
      ],
      blue: [
        'bg-[#2463EB]',
        'text-white',
        'border-transparent',
        'hover:bg-[#2463EB]/80',
        'focus:ring-[#2463EB]',
        'disabled:bg-[#2463EB]',
        'disabled:!opacity-25',
        'disabled:!cursor-not-allowed',
      ],
      secondary: [
        'bg-gray-600',
        'text-white',
        'border-transparent',
        'hover:bg-gray-700',
        'focus:ring-gray-500',
        'disabled:bg-gray-700',
        'disabled:cursor-not-allowed',
      ],
      success: [
        'bg-green-600',
        'text-white',
        'border-transparent',
        'hover:bg-green-700',
        'focus:ring-green-500',
        'disabled:bg-green-700',
        'disabled:cursor-not-allowed',
      ],
      warning: [
        'bg-orange-600',
        'text-white',
        'border-transparent',
        'hover:bg-orange-700',
        'focus:ring-orange-500',
        'disabled:bg-orange-400',
      ],
      danger: [
        'bg-red-600',
        'text-white',
        'border-transparent',
        'hover:bg-red-700',
        'focus:ring-red-500',
        'disabled:bg-red-400',
      ],
      ghost: [
        'bg-transparent',
        'text-gray-700',
        'border-transparent',
        'hover:bg-gray-100',
        'focus:ring-gray-500',
        'disabled:text-gray-400',
      ],
      outline: [
        'bg-white',
        'text-black',
        'border',
        'border-gray-300',
        'hover:bg-gray-50',
        'focus:ring-gray-500',
        'disabled:text-gray-400',
        'disabled:border-gray-200',
      ],
    };

    return variants[variant];
  }

  private getShapeClasses(): string[] {
    if (this.rounded()) {
      return ['rounded-full'];
    }

    const iconOnly = this.iconPosition() === 'only';
    return iconOnly ? ['rounded-lg'] : ['rounded-lg'];
  }
}
