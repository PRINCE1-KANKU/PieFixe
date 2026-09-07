# Pie Fixe Discussion

## Project Direction

The website is called **Pie Fixe** and focuses on repairing home appliances, including:

- TVs and home theatre systems
- Stoves and ovens
- Fridges and freezers
- Air conditioners and climate systems
- Kitchen appliances and other household appliances

The desired experience is dynamic, premium, and editorial, with a magazine-inspired visual texture.

## Design Requirements

- Modern visual direction inspired by Shopify Renaissance-style editorial websites
- Grainy, premium magazine background texture
- Generative cube elements in the visual theme
- Interactive background that subtly shifts with mouse movement
- Diffusion-style page loader that begins at the center, expands across the page, reveals the Pie Fixe logo, and transitions into the site
- Smooth scrolling experience
- Custom cursor interaction
- Responsive mobile layout
- Clear appliance repair booking workflow

## Implemented Website Structure

The website was created as a static front-end project with three main files:

- `index.html` - semantic page structure and content
- `styles.css` - visual system, responsive layout, typography, textures, and animations
- `script.js` - loader, canvas animation, cursor behavior, menu interactions, scroll effects, and form behavior

The page includes:

1. Hero section with the message “Home should just work.”
2. Animated service ticker
3. Appliance service cards
4. “The Pie Fixe way” brand story section
5. Three-step repair process
6. Repair booking form
7. Footer contact information

## Dynamic Features

### Page Loader

A central orange diffusion pulse expands while the Pie Fixe logo appears. The loader then contracts away to reveal the page.

### Generative Cube Background

A canvas-based background creates floating cube elements that:

- Respond to mouse movement
- Drift at different depths
- Rotate subtly over time
- Shift vertically while scrolling
- Use visible top and side faces to create a 3D impression

### 3D Section Scrolling

The page uses a perspective camera effect for section transitions. As sections move through the viewport, they receive:

- Perspective rotation
- Small depth-based vertical movement
- Subtle scale changes
- Smooth settling when centered in the viewport

The effect is reduced automatically when the user prefers reduced motion.

### Responsive Interaction

The site includes:

- Desktop navigation
- Mobile navigation menu
- Responsive two-column and stacked layouts
- Mobile-safe service cards and booking form
- Custom cursor on desktop and normal cursor behavior on mobile

### Booking Form

The booking form validates required fields and displays a success message after submission. It currently behaves as a front-end demo and does not send data to a backend.

## Validation Completed

The site was tested in the browser at desktop and mobile sizes. The following checks passed:

- Page loader completes and releases pointer events
- Canvas matches the viewport size
- Cube animation renders
- Section transforms change while scrolling
- Mobile menu opens correctly
- Mobile layout stays within the viewport
- Booking form reaches its success state
- No editor errors were reported in `index.html`, `styles.css`, or `script.js`
