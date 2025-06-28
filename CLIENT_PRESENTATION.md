# Organization System: Roles, Permissions & Flows

## 1. Introduction

This document outlines the structure of roles, responsibilities, and permissions within the Organization System. It also details the user and organization flows, providing a clear understanding of how users interact with the system and how permissions are managed at both the user and organization levels.

---

## 2. Roles & Responsibilities

### Roles

- **SUPERADMIN**: Full system administrator with access to all organizations, users, and system-wide settings.
- **ADMIN**: Organization-level administrator with broad management capabilities, but cannot manage SUPERADMIN or other ADMINs.
- **ORGADMIN**: Organization administrator who manages users within their own organization.
- **USER**: Regular user with access to features as assigned by their organization.

### Responsibilities

| Role       | Responsibilities                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------- |
| SUPERADMIN | Manage all organizations, users, features, and system-wide settings.                                 |
| ADMIN      | Manage ORGADMIN and USER accounts, oversee organization-level features and settings.                 |
| ORGADMIN   | Manage USER accounts within their organization, invite users, assign USER role, manage org settings. |
| USER       | Access assigned features, submit requests, view personal data.                                       |

---

## 3. Role Hierarchy & Permissions

### Role Hierarchy

- **SUPERADMIN** can manage: ADMIN, ORGADMIN, USER
- **ADMIN** can manage: ORGADMIN, USER
- **ORGADMIN** can manage: USER (within their own organization)
- **USER** cannot manage any roles

### Role-based Permissions

| Role       | View | Create | Edit | Delete | Invite Users  | Manage Settings |
| ---------- | ---- | ------ | ---- | ------ | ------------- | --------------- |
| SUPERADMIN | ✔    | ✔      | ✔    | ✔      | ✔             | ✔               |
| ADMIN      | ✔    | ✔      | ✔    | ✔      | ✔             | ✔               |
| ORGADMIN   | ✔    | ✔      | ✔    | ✔      | ✔ (USER only) | ✔ (org only)    |
| USER       | ✔    | ✖      | ✖    | ✖      | ✖             | ✖               |

### Permission Enforcement

- Users can only create accounts with a lower role than their own.
- Only ORGADMIN, ADMIN, or SUPERADMIN can create users.
- Only ADMIN and SUPERADMIN can list all users (excluding SUPERADMIN).
- Permission updates:
  - SUPERADMIN: can update anyone.
  - ADMIN: can update ORGADMIN and USER.
  - ORGADMIN: can update USER (in their org).

---

## 4. User Flow

1. **Registration/Login**
   - User signs up or logs in to the platform.
2. **Role Assignment**
   - Upon joining, user is assigned a role (by invitation or admin assignment).
3. **Access Features**
   - User accesses features and resources based on their role.
4. **Request Actions**
   - User can submit requests (e.g., join teams, request permissions) as allowed by their role.
5. **Notifications**
   - User receives notifications for relevant actions (invitations, approvals, etc.).

**User Flow Diagram:**

```
User Registration/Login --> Role Assignment --> Access Features --> Request Actions --> Notifications
```

---

## 5. Organization Flow

1. **Organization Creation**
   - SUPERADMIN or authorized ADMIN creates a new organization.
2. **Invite Users**
   - ORGADMIN, ADMIN, or SUPERADMIN invites users and assigns roles (within their allowed hierarchy).
3. **Role Management**
   - Admins manage user roles and permissions within the organization.
4. **Feature Management**
   - Admins enable/disable features for the organization.
5. **Ongoing Management**
   - Users interact, submit requests, and collaborate within the organization.

**Organization Flow Diagram:**

```
Organization Creation --> Invite Users --> Role Management --> Feature Management --> Ongoing Management
```

---

## 6. Example Scenarios

### Scenario 1: Adding a New User

- ORGADMIN invites a new user.
- User receives an invitation and registers.
- ORGADMIN assigns the "USER" role to the new user.
- The new USER can now access features as assigned by the organization.

### Scenario 2: Admin Managing Organization

- ADMIN creates a new ORGADMIN for an organization.
- ORGADMIN manages users within their organization.
- ADMIN oversees organization-level settings and features.

### Scenario 3: Permission Escalation

- A USER requests additional permissions.
- ORGADMIN reviews and approves the request (if within their org).
- If higher permissions are needed, ADMIN or SUPERADMIN must approve and assign the new role.

---

## 7. Summary

This document provides a comprehensive overview of the roles, responsibilities, and permission structure within the Organization System, as well as the typical user and organization flows. This ensures clarity for all stakeholders and supports effective management and collaboration within the platform.
