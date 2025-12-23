# Nested Gallery Structure - Implementation Guide

## ✅ Implementation Complete

Your application now supports **nested folder structures** for galleries, allowing you to organize galleries hierarchically (e.g., "Furniture > Chairs > Antique Chairs").

## 📋 What Was Changed

### 1. **Database Schema** (`MIGRATION_NESTED_GALLERIES.sql`)
   - Added `parent_id` column to `galleries` table
   - Added index for better query performance
   - Existing galleries become root galleries (parent_id = NULL)

### 2. **TypeScript Types** (`types/database.ts`)
   - Updated `Gallery` interface to include `parent_id: string | null`
   - Added optional `children` and `path` fields for tree structure

### 3. **Utility Functions** (`lib/gallery-utils.ts`)
   - `buildGalleryTree()` - Converts flat list to hierarchical tree
   - `flattenGalleryTree()` - Converts tree to flat list with indentation
   - `getGalleryPath()` - Gets full path string (e.g., "Parent > Child")
   - `wouldCreateCircularReference()` - Prevents circular parent references

### 4. **API Routes**
   - **POST `/api/galleries`** - Now accepts `parent_id` parameter
   - **PATCH `/api/galleries/[id]`** - Can update `parent_id` (with validation)
   - **DELETE `/api/galleries/[id]`** - Prevents deletion if gallery has children
   - **GET `/api/galleries`** - Returns galleries with hierarchy support

### 5. **UI Components Updated**

#### **Upload Artwork** (`components/admin/UploadArtworkClient.tsx`)
   - Gallery dropdown shows hierarchical structure with indentation
   - Creating new gallery allows selecting parent gallery
   - Format: `└─ Child Gallery` (indented)

#### **Edit Artwork** (`components/admin/EditArtworkClient.tsx`)
   - Same hierarchical gallery selector
   - Parent selection when creating galleries

#### **Manage Galleries** (to be updated)
   - Will show tree structure
   - Can move galleries between parents

#### **Public Gallery Pages** (to be updated)
   - Will show breadcrumbs (e.g., "Home > Furniture > Chairs")
   - Gallery listing shows hierarchy

## 🚀 Setup Instructions

### Step 1: Run Database Migration

1. Go to your **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `MIGRATION_NESTED_GALLERIES.sql`
3. Run the migration

This will:
- Add `parent_id` column to `galleries` table
- Create index for better performance
- Set all existing galleries to root level (no parent)

### Step 2: Test the Feature

1. **Create a Root Gallery**:
   - Go to `/admin/posts/new`
   - Click "Create new gallery"
   - Enter name (e.g., "Furniture")
   - Leave "No parent" selected
   - Create

2. **Create a Child Gallery**:
   - Click "Create new gallery" again
   - Enter name (e.g., "Chairs")
   - Select "Furniture" as parent
   - Create

3. **Verify Hierarchy**:
   - In gallery dropdown, you should see:
     ```
     No gallery
     Furniture
     └─ Chairs
     ```

## 📝 Usage Examples

### Creating Nested Galleries

**Example Structure:**
```
Furniture
├─ Chairs
│  ├─ Antique Chairs
│  └─ Modern Chairs
└─ Tables
   └─ Dining Tables
```

**Steps:**
1. Create "Furniture" (root)
2. Create "Chairs" (parent: Furniture)
3. Create "Antique Chairs" (parent: Chairs)
4. Create "Modern Chairs" (parent: Chairs)
5. Create "Tables" (parent: Furniture)
6. Create "Dining Tables" (parent: Tables)

### Moving Galleries

You can change a gallery's parent by:
- Editing the gallery in manage galleries page
- Updating via API: `PATCH /api/galleries/[id]` with `{ parent_id: "new-parent-id" }`

## 🔒 Validation & Safety

The system prevents:
- ✅ Circular references (gallery can't be its own ancestor)
- ✅ Self-parenting (gallery can't be its own parent)
- ✅ Deleting galleries with children (must delete/move children first)
- ✅ Invalid parent IDs (parent must exist)

## 🎨 UI Features

### Gallery Dropdown Format
```
No gallery
Furniture
└─ Chairs
   └─ Antique Chairs
Tables
└─ Dining Tables
```

### Breadcrumbs (Coming Soon)
```
Home > Furniture > Chairs > Antique Chairs
```

## 📊 Database Structure

```sql
galleries
├─ id (UUID, PK)
├─ name (TEXT)
├─ parent_id (UUID, FK → galleries.id, NULLABLE)
└─ created_at (TIMESTAMP)
```

## 🔄 Migration Notes

- **Existing galleries**: All become root galleries (parent_id = NULL)
- **No data loss**: All existing galleries and artworks remain intact
- **Backward compatible**: Old code still works (treats NULL parent_id as root)

## ⚠️ Important Notes

1. **Deletion**: You cannot delete a gallery that has children. You must:
   - Delete all child galleries first, OR
   - Move children to a different parent

2. **Circular References**: The system prevents creating circular parent-child relationships

3. **Performance**: The hierarchy is built client-side for dropdowns. For large hierarchies (100+ galleries), consider server-side pagination.

## 🐛 Troubleshooting

### Issue: "Cannot delete gallery with sub-galleries"
**Solution**: Delete or move all child galleries first

### Issue: "Cannot create circular reference"
**Solution**: You're trying to set a gallery as parent of its own ancestor. Choose a different parent.

### Issue: Dropdown shows flat list
**Solution**: Make sure you've run the migration and galleries have `parent_id` set correctly

---

**Status**: ✅ Core functionality complete. Breadcrumbs and tree view in manage galleries coming soon.

