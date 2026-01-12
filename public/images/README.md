# Images Folder

This folder is for storing static images and pictures that can be accessed publicly in your Next.js application.

## Usage

To use images from this folder in your components, reference them with a path starting from `/images/`:

```tsx
// Example: If you upload logo.png to this folder
<img src="/images/logo.png" alt="Logo" />

// Or in CSS
backgroundImage: 'url(/images/background.jpg)'
```

## File Organization

- Upload your images directly to this folder
- Supported formats: `.jpg`, `.jpeg`, `.png`, `.gif`, `.svg`, `.webp`
- For better organization, you can create subfolders like:
  - `/images/logos/`
  - `/images/products/`
  - `/images/banners/`

## Notes

- Files in the `public` folder are served statically and accessible to anyone
- Don't store sensitive images here
- Optimize images before uploading for better performance
