import { Component, input } from '@angular/core';

@Component({
  selector: 'mo-form-error-block',
  imports: [],
  templateUrl: './form-error-block.html',
  styleUrl: './form-error-block.css',
})
export class FormErrorBlock {
  message = input<string | null>(null);
}
