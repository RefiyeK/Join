import { Component } from '@angular/core';
import { ContactDetails } from './components/contact-details/contact-details';
import { ContactsList } from './components/contacts-list/contacts-list';
import { ContactDialog } from './components/contact-dialog/contact-dialog';

@Component({
  selector: 'app-contacts',
  imports: [ContactDetails, ContactsList, ContactDialog],
  templateUrl: './contacts.html',
  styleUrl: './contacts.scss',
})
export class Contacts {}
