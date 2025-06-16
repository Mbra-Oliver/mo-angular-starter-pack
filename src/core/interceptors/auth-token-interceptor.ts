import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';

export const authTokenInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Simule une récupération du token (à adapter à ton AuthService)
  const token = localStorage.getItem('exemple_auth_token');

  // Clone la requête et ajoute l'en-tête Authorization si le token existe
  const authReq = token
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  // Gère la réponse et les erreurs
  return next(authReq).pipe(
    // Intercepte les erreurs
    tap({
      error: (error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Redirige vers login si non autorisé
          router.navigate(['/login']);
        }
      },
    })
  );
};
