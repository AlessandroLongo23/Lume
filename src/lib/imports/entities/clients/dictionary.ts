/**
 * Italian-language fast-path for client column mapping. Headers a salon-software
 * export typically uses, normalized lowercase, mapped to our destination fields.
 * If every required field can be resolved from this dictionary alone, we skip
 * the LLM call entirely.
 */

import type { HeaderDictionary } from '../types';

export type ClientDestField =
  | 'firstName'
  | 'lastName'
  | 'fullName'         // virtual: gets split into first/last
  | 'email'
  | 'phoneRaw'         // virtual: gets parsed into prefix+number
  | 'phonePrefix'
  | 'phoneNumber'
  | 'gender'
  | 'birthDate'
  | 'isTourist'
  | 'note';

export const CLIENT_DICTIONARY: HeaderDictionary = {
  firstName:   ['nome', 'firstname', 'first name', 'first_name', 'given name', 'givenname', 'name'],
  lastName:    ['cognome', 'lastname', 'last name', 'last_name', 'surname', 'family name', 'familyname'],
  fullName:    ['nome completo', 'nominativo', 'cliente', 'full name', 'fullname', 'name and surname', 'ragione sociale'],
  email:       ['email', 'e-mail', 'mail', 'indirizzo email', 'posta elettronica'],
  phoneRaw:    ['telefono', 'cellulare', 'numero', 'numero di telefono', 'cell', 'phone', 'mobile', 'tel', 'telefono cellulare', 'recapito'],
  phonePrefix: ['prefisso', 'prefix', 'country code', 'phone prefix'],
  phoneNumber: ['numero telefono', 'phone number', 'numero cellulare'],
  gender:      ['sesso', 'genere', 'gender', 'sex', 'm/f'],
  birthDate:   ['data di nascita', 'data nascita', 'nato il', 'nata il', 'birthdate', 'birth date', 'date of birth', 'dob', 'compleanno', 'data nasc.', 'datanascita'],
  isTourist:   ['turista', 'tourist', 'cliente turista'],
  note:        ['note', 'note cliente', 'osservazioni', 'commenti', 'notes', 'remarks', 'comments', 'appunti', 'descrizione'],
};

export const ALL_CLIENT_DEST_FIELDS: readonly ClientDestField[] =
  Object.keys(CLIENT_DICTIONARY) as ClientDestField[];
