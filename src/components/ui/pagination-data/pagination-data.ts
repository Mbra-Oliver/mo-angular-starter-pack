import { Component, computed, input, output } from '@angular/core';
export interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface PaginationEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'mo-pagination-data',
  imports: [],
  templateUrl: './pagination-data.html',
  styleUrl: './pagination-data.css',
})
export class PaginationData {
  // Inputs avec signals
  paginationData = input.required<PaginationData>();
  showPageSizeSelector = input<boolean>(true);
  pageSizeOptions = input<number[]>([10, 20, 50, 100]);
  maxVisiblePages = input<number>(7);

  // Outputs
  pageChange = output<PaginationEvent>();

  // Computed signals
  startItem = computed(() => {
    const data = this.paginationData();
    return Math.min(
      (data.currentPage - 1) * data.pageSize + 1,
      data.totalCount
    );
  });

  endItem = computed(() => {
    const data = this.paginationData();
    return Math.min(data.currentPage * data.pageSize, data.totalCount);
  });

  visiblePages = computed(() => {
    const data = this.paginationData();
    const current = data.currentPage;
    const total = data.totalPages;
    const maxVisible = this.maxVisiblePages();

    if (total <= maxVisible) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    const pages: number[] = [];
    const half = Math.floor(maxVisible / 2);

    let start = Math.max(1, current - half);
    let end = Math.min(total, current + half);

    // Ajuster si on est près du début ou de la fin
    if (current <= half) {
      end = Math.min(total, maxVisible - 1);
    } else if (current >= total - half) {
      start = Math.max(1, total - maxVisible + 2);
    }

    // Ajouter la première page si nécessaire
    if (start > 1) {
      pages.push(1);
      if (start > 2) {
        pages.push(-1); // Ellipsis
      }
    }

    // Ajouter les pages du milieu
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Ajouter la dernière page si nécessaire
    if (end < total) {
      if (end < total - 1) {
        pages.push(-1); // Ellipsis
      }
      pages.push(total);
    }

    return pages;
  });

  getPageButtonClass(page: number): string {
    const isActive = page === this.paginationData().currentPage;
    const baseClass =
      'px-3 py-2 text-sm font-medium rounded-md transition-colors';

    if (isActive) {
      return `${baseClass} bg-primary text-white`;
    }

    return `${baseClass} text-gray-700 bg-white border border-gray-300 hover:bg-gray-50`;
  }

  goToPage(page: number): void {
    if (
      page !== this.paginationData().currentPage &&
      page >= 1 &&
      page <= this.paginationData().totalPages
    ) {
      this.pageChange.emit({
        page,
        pageSize: this.paginationData().pageSize,
      });
    }
  }

  goToPreviousPage(): void {
    const data = this.paginationData();
    if (data.hasPrevious) {
      this.goToPage(data.currentPage - 1);
    }
  }

  goToNextPage(): void {
    const data = this.paginationData();
    if (data.hasNext) {
      this.goToPage(data.currentPage + 1);
    }
  }

  onPageSizeChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const newPageSize = parseInt(target.value, 10);

    this.pageChange.emit({
      page: 1, // Retourner à la première page quand on change la taille
      pageSize: newPageSize,
    });
  }
}
