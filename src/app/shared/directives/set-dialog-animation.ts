import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appSetDialogAnimation]',
})
export class SetDialogAnimation {
  isClosing = false;

  /**
   * Constructor injects the dialog element
   * @param dialogRef Reference to the dialog element
   */
  constructor(private dialogRef: ElementRef<HTMLDialogElement>) {}

  /**
   * Opens the dialog window with slide-in animation
   */
  openDialogWithAnimation() {
    this.isClosing = false;
    this.dialogRef.nativeElement.showModal();
    this.dialogRef.nativeElement.classList.remove('slide-out');
    this.dialogRef.nativeElement.classList.add('slide-in');
  }

  /**
   * Closes the dialog window with slide-out animation
   */
  closeDialogWithAnimation() {
    this.isClosing = true;
    this.dialogRef.nativeElement.classList.remove('slide-in');
    this.dialogRef.nativeElement.classList.add('slide-out');

    setTimeout(() => {
      this.isClosing = false;
      this.dialogRef.nativeElement.classList.remove('slide-out');
      this.dialogRef.nativeElement.close();
    }, 500);
  }
}
