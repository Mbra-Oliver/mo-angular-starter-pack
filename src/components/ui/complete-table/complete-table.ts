import {
  Component,
  ChangeDetectionStrategy,
  OnInit,
  OnDestroy,
  TemplateRef,
  input,
  output,
  signal,
  computed,
  effect,
  DestroyRef,
  inject,
  ElementRef,
  HostListener,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Search } from '../search/search';

export interface TableColumnAppearance {
  headerClass?: string;
  cellClass?: string;
  bordered?: boolean;
  background?: string;
  textColor?: string;
  fontWeight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg';
}

export interface BadgeConfig {
  colorMap?: Record<string, string>;
  defaultColor?: string;
  variant?: 'soft' | 'filled' | 'outlined';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  trueFalseLabels?: { true: string; false: string };
  autoDetect?: boolean;
}

export interface TableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  type?:
    | 'text'
    | 'number'
    | 'date'
    | 'boolean'
    | 'badge'
    | 'actions'
    | 'custom'
    | 'auto';
  template?: string;
  format?: (value: any, item?: any) => string;
  badgeConfig?: BadgeConfig;
  resizable?: boolean;
  sticky?: 'left' | 'right';
  visible?: boolean;
  appearance?: TableColumnAppearance;
  searchable?: boolean;
  priority?: number;
}

export interface TableAction {
  id: string;
  label: string;
  icon?: string;
  imageUrl?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info';
  action: (item: any) => void | Promise<void>;
  condition?: (item: any) => boolean;
  tooltip?: string;
  confirmationMessage?: string;
  loading?: boolean;
}

export interface TableConfig {
  // Apparence
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  responsive?: boolean;

  // Fonctionnalités
  loading?: boolean;
  searchable?: boolean;
  selectable?: boolean;
  multiSelect?: boolean;

  // Détection automatique
  autoDetectTypes?: boolean;
  smartBadges?: boolean;

  // Performance
  virtualScrolling?: boolean;
  trackByFunction?: (index: number, item: any) => any;

  // Styles globaux
  globalStyles?: {
    headerBg?: string;
    headerText?: string;
    rowHover?: string;
    selectedBg?: string;
    borderColor?: string;
    fontSize?: 'xs' | 'sm' | 'base' | 'lg';
    defaultBorder?: boolean;
    tableHeight?: string;
  };

  showRowNumbers?: boolean;
  expandableRows?: boolean;
  stickyHeader?: boolean;
}

export interface TableState {
  sortColumn: string;
  sortDirection: 'asc' | 'desc';
  selectedItems: any[];
}

// ===== COMPOSANT PRINCIPAL =====

// ===== COMPOSANT PRINCIPAL =====

@Component({
  selector: 'mo-complete-table',
  imports: [CommonModule, FormsModule, Search],
  templateUrl: './complete-table.html',
  styleUrl: './complete-table.css',
})
export class CompleteTable implements OnInit, OnDestroy {
  private readonly destroyRef = inject(DestroyRef);
  private readonly elementRef = inject(ElementRef);

  // === INPUTS ===
  data = input<any[]>([]);
  columns = input<TableColumn[]>([]);
  actions = input<TableAction[]>([]);

  config = input<TableConfig>({
    autoDetectTypes: true,
    smartBadges: true,
    globalStyles: {
      defaultBorder: true,
      borderColor: 'border-gray-200',
      headerBg: 'bg-gray-50',
      headerText: 'text-gray-900',
      rowHover: 'hover:bg-gray-50',
      selectedBg: 'bg-primary-light',
      fontSize: 'sm',
    },
  });
  customTemplates = input<{ [key: string]: TemplateRef<any> } | null>(null);

  // === OUTPUTS ===
  sortEmit = output<{ column: string; direction: 'asc' | 'desc' }>();
  search = output<string>();
  selectionChange = output<any[]>();
  actionExecuted = output<{ action: TableAction; item: any; result?: any }>();
  stateChange = output<TableState>();

  // === SIGNALS ===
  globalSearchTerm = signal('');
  sortColumn = signal('');
  sortDirection = signal<'asc' | 'desc'>('asc');
  selectedItems = signal<any[]>([]);
  processedColumns = signal<TableColumn[]>([]);
  loadingActions = signal<Set<string>>(new Set());

  // === COMPUTED SIGNALS ===
  visibleColumns = computed(() =>
    this.processedColumns().filter((col) => col.visible !== false)
  );

  openActionDropdowns = signal<Set<number>>(new Set());

  // === PROPRIÉTÉS PRIVÉES ===
  private readonly globalSearchSubject = new Subject<string>();

  // Configurations par défaut améliorées
  private readonly DEFAULT_BOOLEAN_VALUES = {
    true: ['true', '1', 'oui', 'yes', 'actif', 'active', 'enabled', 'on'],
    false: [
      'false',
      '0',
      'non',
      'no',
      'inactif',
      'inactive',
      'disabled',
      'off',
    ],
  };

  private readonly DEFAULT_BADGE_PATTERNS = [
    'status',
    'statut',
    'state',
    'etat',
    'type',
    'category',
    'categorie',
    'priority',
    'priorite',
    'level',
    'niveau',
    'role',
    'grade',
  ];

  constructor() {
    this.setupSearchDebouncing();
    this.setupEffects();
  }

  ngOnInit(): void {
    // Initialisation du composant
  }

  ngOnDestroy(): void {
    // Nettoyage
  }

  // === CONFIGURATION DES EFFETS ===
  private setupEffects(): void {
    // Traitement des colonnes
    effect(() => {
      this.processColumns();
    });

    // Émission des changements d'état
    effect(() => {
      this.emitStateChange();
    });
  }

  private setupSearchDebouncing(): void {
    this.globalSearchSubject
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((term) => {
        this.globalSearchTerm.set(term as string);
        this.search.emit(term as string);
      });
  }

  private emitStateChange(): void {
    const state: TableState = {
      sortColumn: this.sortColumn(),
      sortDirection: this.sortDirection(),
      selectedItems: this.selectedItems(),
    };

    this.stateChange.emit(state);
  }

  // === TRAITEMENT DES COLONNES AMÉLIORÉ ===
  private processColumns(): void {
    const columns = this.columns();
    const data = this.data();
    const config = this.config();

    if (!config.autoDetectTypes || data.length === 0) {
      this.processedColumns.set(this.enhanceColumns(columns));
      return;
    }

    const processedCols = columns.map((column) =>
      this.processColumn(column, data)
    );

    this.processedColumns.set(this.enhanceColumns(processedCols));
  }

  private enhanceColumns(columns: TableColumn[]): TableColumn[] {
    return columns.map((column) => ({
      ...column,
      visible: column.visible !== false,
      priority: column.priority || 0,
      searchable: column.searchable !== false,
    }));
  }

  private processColumn(column: TableColumn, data: any[]): TableColumn {
    const processedColumn = { ...column };

    if (column.type && column.type !== 'auto') {
      return this.enhanceColumn(processedColumn, data);
    }

    // Échantillonnage intelligent
    const sampleSize = Math.min(100, data.length);
    const sample = this.getSampleData(data, sampleSize);
    const values = sample
      .map((item) => this.getNestedValue(item, column.key))
      .filter((val) => val !== null && val !== undefined && val !== '');

    if (values.length === 0) {
      return this.enhanceColumn(processedColumn, data);
    }

    // Détection du type avec cache
    const detectedType = this.detectColumnTypeEnhanced(column.key, values);
    processedColumn.type = detectedType;

    // Configuration automatique
    this.configureColumnByType(processedColumn, values, data);

    return processedColumn;
  }

  private getSampleData(data: any[], sampleSize: number): any[] {
    if (data.length <= sampleSize) return data;

    // Échantillonnage stratifié pour une meilleure représentation
    const step = Math.floor(data.length / sampleSize);
    const sample = [];

    for (let i = 0; i < data.length; i += step) {
      sample.push(data[i]);
      if (sample.length >= sampleSize) break;
    }

    return sample;
  }

  private detectColumnTypeEnhanced(
    columnKey: string,
    values: any[]
  ): TableColumn['type'] {
    const stringValues = values.map((v) => String(v).toLowerCase().trim());
    const uniqueValues = [...new Set(stringValues)].filter((v) => v !== '');

    // Cache pour éviter les recalculs
    const typeDetectionCache = new Map<string, TableColumn['type']>();
    const cacheKey = `${columnKey}_${uniqueValues.join('_')}`;

    if (typeDetectionCache.has(cacheKey)) {
      return typeDetectionCache.get(cacheKey)!;
    }

    let detectedType: TableColumn['type'] = 'text';

    // Détection booléenne (priorité haute)
    if (this.isBooleanColumn(uniqueValues)) {
      detectedType = 'boolean';
    }
    // Détection date
    else if (this.isDateColumn(values)) {
      detectedType = 'date';
    }
    // Détection numérique
    else if (this.isNumberColumn(values)) {
      detectedType = 'number';
    }
    // Détection badge
    else if (this.shouldBeBadge(columnKey, uniqueValues)) {
      detectedType = 'badge';
    }

    typeDetectionCache.set(cacheKey, detectedType);
    return detectedType;
  }

  private isBooleanColumn(uniqueValues: string[]): boolean {
    if (!uniqueValues || uniqueValues.length === 0 || uniqueValues.length > 3) {
      return false;
    }

    const booleanValuesSet = new Set(
      this.DEFAULT_BOOLEAN_VALUES.true.concat(this.DEFAULT_BOOLEAN_VALUES.false)
    );
    return uniqueValues.every(
      (val) => booleanValuesSet.has(val) || val === '' || val === 'null'
    );
  }

  private isDateColumn(values: any[]): boolean {
    const validDateCount = values.filter((val) => {
      if (val instanceof Date) return !isNaN(val.getTime());

      const dateStr = String(val);
      // Patterns de date communs
      const datePatterns = [
        /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
        /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, // ISO format
      ];

      if (datePatterns.some((pattern) => pattern.test(dateStr))) {
        const date = new Date(val);
        return !isNaN(date.getTime()) && date.getFullYear() > 1900;
      }

      return false;
    }).length;

    return validDateCount / values.length > 0.7; // 70% de dates valides
  }

  toggleActionsDropdown(rowIndex: number): void {
    const openDropdowns = this.openActionDropdowns();
    const newOpenDropdowns = new Set(openDropdowns);

    if (newOpenDropdowns.has(rowIndex)) {
      newOpenDropdowns.delete(rowIndex);
    } else {
      // Fermer tous les autres dropdowns et ouvrir celui-ci
      newOpenDropdowns.clear();
      newOpenDropdowns.add(rowIndex);
    }

    this.openActionDropdowns.set(newOpenDropdowns);
  }

  isActionsDropdownOpen(rowIndex: number): boolean {
    return this.openActionDropdowns().has(rowIndex);
  }

  closeAllActionDropdowns(): void {
    this.openActionDropdowns.set(new Set());
  }

  async executeActionFromDropdown(
    action: TableAction,
    item: any,
    rowIndex: number
  ): Promise<void> {
    // Fermer le dropdown après l'exécution
    this.closeActionDropdown(rowIndex);

    // Exécuter l'action
    await this.executeAction(action, item);
  }

  private closeActionDropdown(rowIndex: number): void {
    const openDropdowns = this.openActionDropdowns();
    const newOpenDropdowns = new Set(openDropdowns);
    newOpenDropdowns.delete(rowIndex);
    this.openActionDropdowns.set(newOpenDropdowns);
  }

  private isNumberColumn(values: any[]): boolean {
    const numberCount = values.filter((val) => {
      const num = Number(val);
      return !isNaN(num) && isFinite(num) && val !== '';
    }).length;

    return numberCount / values.length > 0.8; // 80% de nombres valides
  }

  private shouldBeBadge(columnKey: string, uniqueValues: string[]): boolean {
    const config = this.config();
    if (!config.smartBadges) return false;

    const keyLower = columnKey.toLowerCase();
    const matchesPattern = this.DEFAULT_BADGE_PATTERNS.some((pattern) =>
      keyLower.includes(pattern)
    );

    const reasonableValueCount =
      uniqueValues.length >= 2 && uniqueValues.length <= 15;
    const avgLength =
      uniqueValues.reduce((sum, val) => sum + val.length, 0) /
      uniqueValues.length;
    const shortValues = avgLength <= 20; // Les badges doivent être courts

    return matchesPattern || (reasonableValueCount && shortValues);
  }

  // === MÉTHODES D'INTERFACE ===

  // Recherche
  onGlobalSearch(term: string): void {
    this.globalSearchTerm.set(term);
    this.globalSearchSubject.next(term);
  }

  clearGlobalSearch(): void {
    this.globalSearchTerm.set('');
    this.globalSearchSubject.next('');
  }

  // Tri
  sort(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
    this.sortEmit.emit({
      column: this.sortColumn(),
      direction: this.sortDirection(),
    });
  }

  // Actions
  async executeAction(action: TableAction, item: any): Promise<void> {
    if (action.loading) return;

    try {
      action.loading = true;
      this.loadingActions.update((actions) => new Set([...actions, action.id]));

      const result = await action.action(item);
      this.actionExecuted.emit({ action, item, result });
    } catch (error) {
      console.error("Erreur lors de l'exécution de l'action:", error);
    } finally {
      action.loading = false;
      this.loadingActions.update((actions) => {
        const newActions = new Set(actions);
        newActions.delete(action.id);
        return newActions;
      });
    }
  }

  // === MÉTHODES UTILITAIRES ===

  getVisibleColumns(): TableColumn[] {
    return this.processedColumns().filter((column) => column.visible !== false);
  }

  getVisibleActions(item: any): TableAction[] {
    return this.actions().filter(
      (action) => !action.condition || action.condition(item)
    );
  }

  getSortAriaLabel(column: TableColumn): string | null {
    if (!column.sortable) return null;

    if (this.sortColumn() === column.key) {
      return `Trié par ${column.label} en ordre ${
        this.sortDirection() === 'asc' ? 'croissant' : 'décroissant'
      }`;
    }

    return `Trier par ${column.label}`;
  }

  getRowNumber(index: number): number {
    return index + 1;
  }

  hasToolbarActions(): boolean {
    const config = this.config();
    return Boolean(config.selectable) || Boolean(config.searchable);
  }

  getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  formatValue(value: any, column: TableColumn, item?: any): any {
    if (value === null || value === undefined) return '-';

    if (column.format) {
      return column.format(value, item);
    }

    switch (column.type) {
      case 'boolean':
        return this.formatBooleanValue(value, column);
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'number':
        return typeof value === 'number' ? value.toLocaleString() : value;
      default:
        return value;
    }
  }

  private formatBooleanValue(value: any, column: TableColumn): string {
    const config = column.badgeConfig;
    const labels = config?.trueFalseLabels || { true: 'Oui', false: 'Non' };

    if (typeof value === 'boolean') {
      return value ? labels.true : labels.false;
    }

    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (this.DEFAULT_BOOLEAN_VALUES.true.includes(lowerValue)) {
        return labels.true;
      }
      if (this.DEFAULT_BOOLEAN_VALUES.false.includes(lowerValue)) {
        return labels.false;
      }
    }

    return value;
  }

  // Méthodes de style et CSS
  getTableClass(): string {
    const classes = ['min-w-full divide-y divide-gray-200'];

    if (this.config().bordered) {
      classes.push('border border-gray-200');
    }

    if (this.config().globalStyles?.defaultBorder) {
      classes.push('border border-gray-200');
    }

    return classes.join(' ');
  }

  getHeaderClass(column?: TableColumn): string {
    const classes = ['bg-gray-50'];

    if (column?.appearance?.headerClass) {
      classes.push(column.appearance.headerClass);
    }

    if (column?.sticky) {
      classes.push(`sticky-${column.sticky}`);
    }

    return classes.join(' ');
  }

  getCellClass(column: TableColumn): string {
    const classes = [];

    if (column.appearance?.cellClass) {
      classes.push(column.appearance.cellClass);
    }

    if (column.sticky) {
      classes.push(`sticky-${column.sticky}`);
    }

    return classes.join(' ');
  }

  getAlignClass(align?: string): string {
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      default:
        return 'text-left';
    }
  }

  getBadgeClass(value: any, config?: BadgeConfig): string {
    if (!config) return '';

    const baseClasses = [
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
    ];

    if (config.variant === 'soft') {
      return `${baseClasses.join(' ')} ${this.getSoftBadgeColors(
        this.getBadgeColor(value, config)
      )}`;
    }

    if (config.variant === 'filled') {
      return `${baseClasses.join(' ')} ${this.getFilledBadgeColors(
        this.getBadgeColor(value, config)
      )}`;
    }

    return `${baseClasses.join(' ')} ${this.getOutlinedBadgeColors(
      this.getBadgeColor(value, config)
    )}`;
  }

  private getBadgeColor(value: any, config: BadgeConfig): string {
    if (config?.colorMap && config.colorMap[value]) {
      return config.colorMap[value];
    }

    if (typeof value === 'boolean') {
      return value ? 'green' : 'red';
    }

    return config?.defaultColor || 'gray';
  }

  private getSoftBadgeColors(color: string): string {
    const colorMap: Record<string, string> = {
      gray: 'inline-flex items-center whitespace-nowrap bg-white border border-gray-300 text-gray-900 gap-1 px-3 py-1 text-xs  rounded-full',

      red: 'bg-red-100 text-red-800',
      yellow: 'bg-yellow-100 text-yellow-800',
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      indigo: 'bg-indigo-100 text-indigo-800',
      purple: 'bg-purple-100 text-purple-800',
      pink: 'bg-pink-100 text-pink-800',
    };

    return colorMap[color] || colorMap['gray'];
  }

  private getFilledBadgeColors(color: string): string {
    const colorMap: Record<string, string> = {
      gray: 'bg-gray-500 text-white',
      red: 'bg-red-500 text-white',
      yellow: 'bg-yellow-500 text-white',
      green: 'bg-green-500 text-white',
      blue: 'bg-blue-500 text-white',
      indigo: 'bg-indigo-500 text-indigo-800',
      purple: 'bg-purple-500 text-white',
      pink: 'bg-pink-500 text-white',
    };

    return colorMap[color] || colorMap['gray'];
  }

  private getOutlinedBadgeColors(color: string): string {
    const colorMap: Record<string, string> = {
      gray: 'border border-gray-300 text-gray-700',
      red: 'border border-red-300 text-red-700',
      yellow: 'border border-yellow-300 text-yellow-700',
      green: 'border border-green-300 text-green-700',
      blue: 'border border-blue-300 text-blue-700',
      indigo: 'border border-indigo-300 text-indigo-700',
      purple: 'border border-purple-300 text-purple-700',
      pink: 'border border-pink-300 text-pink-700',
    };

    return colorMap[color] || colorMap['gray'];
  }

  getActionButtonClass(color?: string): string {
    const baseClasses = [
      'inline-flex items-center px-3 py-1.5 text-xs cursor-pointer font-medium rounded-md transition-colors',
    ];

    const colorMap: Record<string, string> = {
      primary: 'text-primary  hover:text-primary-600',
      secondary: 'text-gray-500 hover:text-gray-600',
      success: 'text-green-500 hover:text-green-600',
      warning: 'text-yellow-500 hover:text-yellow-600',
      danger: 'text-red-500 hover:text-red-600',
      info: 'text-blue-500 hover:text-blue-600',
    };

    return `${baseClasses.join(' ')} ${colorMap[color || 'primary']}`;
  }

  getTableRowClass(index: number, isSelected: boolean): string {
    const classes = [];

    if (this.config().striped && index % 2 === 1) {
      classes.push('bg-gray-50');
    }

    if (this.config().hover) {
      classes.push('hover:bg-gray-100');
    }

    if (isSelected) {
      classes.push(
        this.config().globalStyles?.selectedBg || 'bg-primary-light'
      );
    }

    return classes.join(' ');
  }

  getColspan(): number {
    let colspan = this.getVisibleColumns().length;

    if (this.config().showRowNumbers) {
      colspan++;
    }

    if (this.config().selectable) {
      colspan++;
    }

    return colspan;
  }

  trackByFn(index: number, item: any): any {
    const trackByFunction = this.config().trackByFunction;
    if (typeof trackByFunction === 'function') {
      return trackByFunction(index, item);
    }

    return item.id || index;
  }

  // === MÉTHODES DE SÉLECTION AMÉLIORÉES ===

  toggleSelection(item: any): void {
    const currentSelection = this.selectedItems();
    const index = currentSelection.findIndex((selected) =>
      this.compareItems(selected, item)
    );

    if (index === -1) {
      this.selectedItems.set([...currentSelection, item]);
    } else {
      this.selectedItems.set(currentSelection.filter((_, i) => i !== index));
    }

    this.selectionChange.emit(this.selectedItems());
  }

  toggleAllSelection(): void {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      this.selectedItems.set([...this.data()]);
      this.selectionChange.emit(this.selectedItems());
    }
  }

  isSelected(item: any): boolean {
    return this.selectedItems().some((selected) =>
      this.compareItems(selected, item)
    );
  }

  isAllSelected(): boolean {
    return (
      this.data().length > 0 &&
      this.data().every((item) => this.isSelected(item))
    );
  }

  isPartiallySelected(): boolean {
    return this.selectedItems().length > 0 && !this.isAllSelected();
  }

  clearSelection(): void {
    this.selectedItems.set([]);
    this.selectionChange.emit([]);
  }

  private compareItems(item1: any, item2: any): boolean {
    const trackByFn = this.config().trackByFunction;
    if (typeof trackByFn === 'function') {
      return trackByFn(0, item1) === trackByFn(0, item2);
    }

    return item1?.id === item2?.id;
  }

  // === CONFIGURATION AVANCÉE DES COLONNES ===

  private configureColumnByType(
    column: TableColumn,
    values: any[],
    allData: any[]
  ): void {
    switch (column.type) {
      case 'badge':
        this.configureBadgeColumn(column, values);
        break;
      case 'boolean':
        this.configureBooleanColumn(column);
        break;
      case 'date':
        this.configureDateColumn(column);
        break;
      case 'number':
        this.configureNumberColumn(column);
        break;
    }
  }

  private configureBadgeColumn(column: TableColumn, values: any[]): void {
    if (!column.badgeConfig) {
      column.badgeConfig = {};
    }

    if (!column.badgeConfig.colorMap) {
      const uniqueValues = [...new Set(values.map((v) => String(v)))];
      column.badgeConfig.colorMap =
        this.generateIntelligentColorMap(uniqueValues);
    }

    column.badgeConfig.defaultColor = column.badgeConfig.defaultColor || 'gray';
    column.badgeConfig.variant = column.badgeConfig.variant || 'soft';
    column.badgeConfig.size = column.badgeConfig.size || 'sm';
  }

  private configureBooleanColumn(column: TableColumn): void {
    if (!column.badgeConfig) {
      column.badgeConfig = {
        trueFalseLabels: { true: 'Oui', false: 'Non' },
      };
    }
  }

  private configureDateColumn(column: TableColumn): void {
    if (!column.format) {
      column.format = (value) => {
        if (!value) return '';
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toLocaleDateString('fr-FR');
      };
    }
  }

  private configureNumberColumn(column: TableColumn): void {
    column.align = column.align || 'right';

    if (!column.format) {
      column.format = (value) => {
        const num = Number(value);
        return isNaN(num) ? value : num.toLocaleString('fr-FR');
      };
    }
  }

  private generateIntelligentColorMap(
    values: string[]
  ): Record<string, string> {
    const semanticColors: Record<string, string> = {
      // Statuts positifs
      actif: 'green',
      active: 'green',
      enabled: 'green',
      on: 'green',
      oui: 'green',
      yes: 'green',
      true: 'green',
      success: 'green',
      validé: 'green',
      approved: 'green',
      confirmé: 'green',
      terminé: 'green',

      // Statuts négatifs
      inactif: 'red',
      inactive: 'red',
      disabled: 'red',
      off: 'red',
      non: 'red',
      no: 'red',
      false: 'red',
      error: 'red',
      rejected: 'red',
      refusé: 'red',
      annulé: 'red',
      échec: 'red',

      // Statuts d'attente/warning
      pending: 'yellow',
      'en attente': 'yellow',
      warning: 'yellow',
      attention: 'yellow',
      'en cours': 'yellow',
      processing: 'yellow',

      // Statuts informatifs
      info: 'blue',
      information: 'blue',
      draft: 'blue',
      brouillon: 'blue',
      nouveau: 'blue',
      new: 'blue',

      // Priorités
      high: 'red',
      haute: 'red',
      urgent: 'red',
      medium: 'yellow',
      moyenne: 'yellow',
      normal: 'yellow',
      low: 'green',
      basse: 'green',
      faible: 'green',
    };

    const availableColors = [
      'blue',
      'green',
      'yellow',
      'purple',
      'pink',
      'indigo',
      'orange',
      'teal',
    ];
    const colorMap: Record<string, string> = {};

    values.forEach((value, index) => {
      const valueLower = value.toLowerCase().trim();

      // Chercher une correspondance sémantique
      const semanticColor = Object.entries(semanticColors).find(([key]) =>
        valueLower.includes(key)
      )?.[1];

      if (semanticColor) {
        colorMap[value] = semanticColor;
      } else {
        // Attribution cyclique pour les autres valeurs
        colorMap[value] = availableColors[index % availableColors.length];
      }
    });

    return colorMap;
  }

  private enhanceColumn(column: TableColumn, data: any[]): TableColumn {
    // Appliquer les améliorations par défaut même si le type est prédéfini
    return {
      ...column,
      visible: column.visible !== false,
      searchable: column.searchable !== false,
      priority: column.priority || 0,
    };
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    // Vérifier si le clic est en dehors du composant
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.closeAllActionDropdowns();
    }
  }
}
