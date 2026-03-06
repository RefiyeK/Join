import { inject } from '@angular/core';
import { CanActivateFn, CanMatchFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const allowed = await authService.isAuthenticatedOrGuestAsync();
    return allowed ? true : router.createUrlTree(['/login'], { queryParams: { redirectTo: state.url } });
  } catch {
    return router.createUrlTree(['/login']);
  }
};

export const authMatchGuard: CanMatchFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  try {
    const allowed = await authService.isAuthenticatedOrGuestAsync();
    return allowed ? true : router.createUrlTree(['/login']);
  } catch {
    return router.createUrlTree(['/login']);
  }
};
