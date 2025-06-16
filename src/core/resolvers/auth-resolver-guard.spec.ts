import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { authResolverGuard } from './auth-resolver-guard';

describe('authResolverGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => authResolverGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
