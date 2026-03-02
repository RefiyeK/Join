import { Directive, ElementRef } from '@angular/core';

@Directive({
  selector: '[appSetDialogAnimation]',
})
export class SetDialogAnimation {
  isClosing = false;

  /**
   * Konstruktor injiziert das Dialog-Element
   * @param dialogRef Referenz auf das Dialog-Element
   */
  constructor(private dialogRef: ElementRef<HTMLDialogElement>) {}

  /**
   * Öffnet das Dialogfenster mit Slide-In-Animation
   */
  openDialogWithAnimation() {
    this.isClosing = false;
    this.dialogRef.nativeElement.showModal();
    this.dialogRef.nativeElement.classList.remove('slide-out');
    this.dialogRef.nativeElement.classList.add('slide-in');
  }

  /**
   * Schließt das Dialogfenster mit Slide-Out-Animation
   */
  closeDialogWithAnimation() {
    this.isClosing = true;
    this.dialogRef.nativeElement.classList.remove('slide-in');
    this.dialogRef.nativeElement.classList.add('slide-out');

    setTimeout(() => {
      this.isClosing = false;
      this.dialogRef.nativeElement.classList.remove('slide-out');
      this.dialogRef.nativeElement.close();
    }, 500); // Dauer muss mit CSS übereinstimmen
  }
}
