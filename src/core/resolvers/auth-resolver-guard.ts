import { CanActivateFn } from '@angular/router';

export const authResolverGuard: CanActivateFn = (route, state) => {
  return true;
};
