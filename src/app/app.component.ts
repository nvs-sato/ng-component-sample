import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

interface BreadcrumbItem {
  label: string;
  url: string;
}

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  breadcrumbs: BreadcrumbItem[] = [];
  private readonly subscription = new Subscription();

  constructor(private readonly router: Router) {}

  ngOnInit(): void {
    this.updateBreadcrumbs(this.router.url);

    this.subscription.add(
      this.router.events
        .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
        .subscribe((event) => this.updateBreadcrumbs(event.urlAfterRedirects))
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private updateBreadcrumbs(url: string): void {
    const segments = url.split('?')[0].split('/').filter(Boolean);
    const items: BreadcrumbItem[] = [{ label: 'ホーム', url: '/' }];
    const labels: Record<string, string> = {
      jyucyu: '受注',
      list: '受注一覧',
      register: '受注登録',
      ikkatsu: '受注一括登録'
    };

    let currentPath = '';
    segments.forEach((segment) => {
      currentPath += `/${segment}`;
      items.push({
        label: labels[segment] ?? segment,
        url: currentPath
      });
    });

    this.breadcrumbs = items;
  }
}
