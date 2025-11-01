// Export all CRM services
export { companiesService } from './companies.service';
export { contactsService } from './contacts.service';
export { dealsService } from './deals.service';
export { productsService } from './products.service';
export { tasksService } from './tasks.service';
export { interactionsService } from './interactions.service';
export { profilesService } from './profiles.service';
export { roomsService, messagesService } from './rooms.service';
export { discussionsService, chatsService, notificationsService } from './discussions.service';

// Import services for the convenience object
import { companiesService } from './companies.service';
import { contactsService } from './contacts.service';
import { dealsService } from './deals.service';
import { productsService } from './products.service';
import { tasksService } from './tasks.service';
import { interactionsService } from './interactions.service';
import { profilesService } from './profiles.service';
import { roomsService, messagesService } from './rooms.service';
import { discussionsService, chatsService, notificationsService } from './discussions.service';

// Re-export for convenience with namespace
export * as CRM from './companies.service';
export * as Contacts from './contacts.service';
export * as Deals from './deals.service';
export * as Products from './products.service';
export * as Tasks from './tasks.service';
export * as Interactions from './interactions.service';
export * as Team from './profiles.service';
export * as Communication from './rooms.service';
export * as AI from './discussions.service';

// Common service patterns
export const services = {
    companies: companiesService,
    contacts: contactsService,
    deals: dealsService,
    products: productsService,
    tasks: tasksService,
    interactions: interactionsService,
    profiles: profilesService,
    rooms: roomsService,
    messages: messagesService,
    discussions: discussionsService,
    chats: chatsService,
    notifications: notificationsService
} as const;