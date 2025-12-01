# Payment Configuration Admin Feature

## 🔐 Overview

A secure admin interface for managing payment configurations (MTN MoMo, Moov MoMo, and bank account details) with **two-factor authentication (2FA)** protection.

## ✨ Features

### 1. Payment Config Management
- **View all payment configurations** (active and inactive)
- **Add new payment methods** (MTN MoMo, Moov MoMo, Bank Transfer)
- **Edit existing payment configs** (account numbers, names, instructions)
- **Delete payment configs** (with 2FA protection)
- **Toggle active/inactive status** (control visibility to guests)
- **Set display order** (control order shown to guests)

### 2. Two-Factor Authentication (2FA)
All changes to payment configurations require **two-factor authentication**:

1. **Security Question**: Admin must answer a security question
   - Default question: "What is the name of this platform?"
   - Answer: "MAXED HOMES" (case-insensitive)
   - Can be customized in the component code

2. **Confirmation Code**: Admin must enter a randomly generated 6-character code
   - Code is displayed in the modal
   - Must be entered exactly (case-insensitive)
   - New code generated for each attempt

### 3. Security Features
- ✅ **2FA Required**: All create/update/delete operations require 2FA
- ✅ **Password Masking**: Security answer can be hidden/shown
- ✅ **Validation**: Both security answer and confirmation code must be correct
- ✅ **Error Handling**: Clear error messages for incorrect inputs
- ✅ **Loading States**: Visual feedback during operations
- ✅ **RLS Protection**: Database-level security via Row Level Security policies

## 📋 Usage

### Accessing the Feature

1. Navigate to **Admin Dashboard**
2. Click on **"Payments"** in the sidebar
3. You'll see the Payment Configuration management interface

### Adding a Payment Method

1. Click **"Add Payment Method"** button
2. Fill in the form:
   - **Payment Method**: Select MTN MoMo, Moov MoMo, or Bank Transfer
   - **Account Name**: Name associated with the account
   - **Account Number**: Phone number or bank account number
   - **Bank Name**: (Optional) For bank transfers only
   - **Instructions**: (Optional) Payment instructions for guests
   - **Display Order**: Order in which it appears (lower numbers first)
   - **Active**: Toggle to show/hide from guests
3. Click **"Save Changes"**
4. Complete 2FA verification:
   - Answer the security question
   - Enter the confirmation code
5. Payment method is created

### Editing a Payment Method

1. Click the **Edit** icon (pencil) next to the payment method
2. Modify the fields as needed
3. Click **"Save Changes"**
4. Complete 2FA verification
5. Changes are saved

### Deleting a Payment Method

1. Click the **Delete** icon (trash) next to the payment method
2. Complete 2FA verification
3. Payment method is deleted

## 🔒 Security Configuration

### Customizing the Security Question

To change the security question and answer, edit `src/components/admin/PaymentConfigManagement.tsx`:

```typescript
// Line ~15-16
const SECURITY_QUESTION = "Your custom question here?";
const SECURITY_ANSWER = "YOUR_ANSWER"; // Case-insensitive
```

### Best Practices

1. **Change Default Security Question**: Don't use the default question in production
2. **Use Strong Answers**: Choose answers that are:
   - Known only to authorized admins
   - Not easily guessable
   - Not related to publicly available information
3. **Regular Updates**: Periodically update the security question/answer
4. **Admin Training**: Ensure all admins know the security question/answer

## 🎨 UI Components

### Main Interface
- **Table View**: Lists all payment configurations
- **Add Button**: Opens form to add new payment method
- **Edit/Delete Actions**: Per-row actions for each config
- **Status Badges**: Visual indicators for active/inactive status

### Security Modal
- **Warning Banner**: Highlights the security requirement
- **Security Question Section**: Displays question and input field
- **Confirmation Code Section**: Shows code and input field
- **Password Toggle**: Show/hide security answer
- **Validation**: Real-time error messages

### Form Modal
- **Payment Method Selector**: Dropdown for method type
- **Account Details**: Name and number inputs
- **Bank Name**: Optional field for bank transfers
- **Instructions**: Textarea for payment instructions
- **Active Toggle**: Checkbox to enable/disable
- **Display Order**: Number input for ordering

## 📁 File Structure

```
src/
├── components/
│   └── admin/
│       └── PaymentConfigManagement.tsx    # Main component
├── hooks/
│   ├── usePaymentConfig.ts                # Fetch payment configs
│   └── usePaymentConfigManagement.ts      # Create/update/delete operations
├── lib/
│   └── queries/
│       └── paymentConfig.ts               # Database queries
└── pages/
    └── AdminDashboard.tsx                 # Added payments tab
```

## 🔧 Technical Details

### Database Operations
- **Create**: `paymentConfigQueries.create()`
- **Read**: `paymentConfigQueries.getAll()` (admin) or `getActive()` (guests)
- **Update**: `paymentConfigQueries.update()`
- **Delete**: `paymentConfigQueries.delete()`

### Security Flow
1. User initiates action (create/update/delete)
2. Security modal opens
3. User answers security question
4. User enters confirmation code
5. Both are validated
6. If valid, action is executed
7. If invalid, error is shown and user can retry

### Caching
- Payment configs are cached for 5 minutes
- Cache is cleared when configs are created/updated/deleted
- Ensures guests see updated payment details quickly

## 🚨 Important Notes

1. **Security Question**: Change the default security question before production use
2. **Admin Access**: Only users with admin privileges can access this feature
3. **RLS Policies**: Database RLS policies enforce admin-only access
4. **Active Status**: Only active payment configs are shown to guests
5. **Display Order**: Lower numbers appear first in the payment methods list

## 🧪 Testing Checklist

- [ ] Can view all payment configs (active and inactive)
- [ ] Can add new payment method with 2FA
- [ ] Can edit existing payment method with 2FA
- [ ] Can delete payment method with 2FA
- [ ] Security question validation works
- [ ] Confirmation code validation works
- [ ] Incorrect security answer shows error
- [ ] Incorrect confirmation code shows error
- [ ] Active/inactive toggle works
- [ ] Display order affects guest view
- [ ] Changes are reflected in guest booking confirmation page
- [ ] Non-admin users cannot access this feature

## 📝 Future Enhancements

1. **Multiple Security Questions**: Rotate between multiple questions
2. **Admin-Specific Questions**: Different questions per admin
3. **Audit Log**: Log all payment config changes
4. **Email Notifications**: Notify admins when payment configs change
5. **Backup/Restore**: Ability to backup and restore payment configs
6. **History**: View change history for each payment config

