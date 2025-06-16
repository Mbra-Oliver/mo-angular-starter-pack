import { Component, OnDestroy } from '@angular/core';
import {
  ActivatedRoute,
  NavigationEnd,
  ActivatedRouteSnapshot,
  Router,
} from '@angular/router';

import { Subject, filter, takeUntil } from 'rxjs';
import { IBreadcrumbItem } from '../../interfaces/IBreadcrumb';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'mo-breadcrumb',
  imports: [CommonModule],
  templateUrl: './breadcrumb.html',
  styleUrl: './breadcrumb.css',
})
export class Breadcrumb implements OnDestroy {
  breadcrumbItems: IBreadcrumbItem[] = [];
  pageTitle: string = '';
  private destroy$ = new Subject<void>();

  constructor(private router: Router, private activatedRoute: ActivatedRoute) {
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.breadcrumbItems = this.getBreadcrumbItems();
        this.pageTitle = this.getPageTitle();
      });

    // Initialisation au chargement
    this.breadcrumbItems = this.getBreadcrumbItems();
    this.pageTitle = this.getPageTitle();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private getPageTitle(): string {
    let route = this.activatedRoute.snapshot;
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route.data['title'] || '';
  }

  private getBreadcrumbItems(): IBreadcrumbItem[] {
    const breadcrumbItems: IBreadcrumbItem[] = [];
    let route: ActivatedRouteSnapshot | null = this.activatedRoute.snapshot;
    let url = '';

    // Parcourir toutes les routes depuis la racine
    while (route) {
      // Construire l'URL progressive
      if (route.url.length > 0) {
        url += '/' + route.url.map((segment) => segment.path).join('/');
      }

      // Ajouter l'élément breadcrumb si il existe
      if (route.data['breadcrumb']) {
        const label = route.data['breadcrumb'];

        // Vérifier si on doit exclure cet élément (plus de 3 tirets)
        const shouldExclude = (label.match(/-/g) || []).length >= 3;

        if (!shouldExclude) {
          breadcrumbItems.push({
            label: label,
            url: url,
            isClickable: true,
          });
        }
      }

      route = route.firstChild;
    }

    return breadcrumbItems;
  }

  onBreadcrumbClick(item: IBreadcrumbItem): void {
    if (item.isClickable && item.url) {
      this.router.navigate([item.url]);
    }
  }
}
