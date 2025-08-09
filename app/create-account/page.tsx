import { redirect } from 'next/navigation';

// Redirect to login page as per the original routing
export default function CreateAccount() {
  redirect('/login');
}