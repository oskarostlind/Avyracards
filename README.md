# AvyraCards-Next.js
Digitallt visitkort, kopplat med ett NFC kort med pekbar domän. 

```
SocialCard-Next.js
├─ .eslintrc.json
├─ next-env.d.ts
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  ├─ 20251120214444_add_email_verification
│  │  │  └─ migration.sql
│  │  ├─ 20251124212821_add_contact_fields
│  │  │  └─ migration.sql
│  │  ├─ 20251129001129_add_redirect_enabled
│  │  │  └─ migration.sql
│  │  ├─ 20251130224209_add_profile_mode_to_user
│  │  │  └─ migration.sql
│  │  ├─ 20251203203949_add_business_profile_fields
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  ├─ schema.prisma
│  └─ seed.ts
├─ public
│  ├─ ads.txt
│  ├─ default-profile.png
│  ├─ media
│  │  └─ socialcard-demo.mp4
│  └─ wallet
│     ├─ icon.png
│     └─ logo.png
├─ README.md
├─ src
│  ├─ actions
│  │  ├─ admin.ts
│  │  └─ reset-password.ts
│  ├─ app
│  │  ├─ (auth)
│  │  │  ├─ login
│  │  │  │  └─ page.tsx
│  │  │  └─ register
│  │  │     └─ page.tsx
│  │  ├─ activate
│  │  │  ├─ confirm
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ admin
│  │  │  ├─ orders
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ products
│  │  │  │  └─ page.tsx
│  │  │  └─ users
│  │  │     ├─ page.tsx
│  │  │     └─ [id]
│  │  │        └─ page.tsx
│  │  ├─ api
│  │  │  ├─ account
│  │  │  │  └─ route.ts
│  │  │  ├─ admin
│  │  │  │  ├─ discounts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ orders
│  │  │  │  │  └─ [id]
│  │  │  │  │     ├─ generate
│  │  │  │  │     │  └─ route.ts
│  │  │  │  │     └─ status
│  │  │  │  │        └─ route.ts
│  │  │  │  └─ products
│  │  │  │     └─ route.ts
│  │  │  ├─ analytics
│  │  │  │  └─ route.ts
│  │  │  ├─ auth
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ resend-verification
│  │  │  │     └─ route.ts
│  │  │  ├─ cards
│  │  │  │  └─ claim
│  │  │  │     └─ route.ts
│  │  │  ├─ links
│  │  │  │  ├─ reorder
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ me
│  │  │  │  └─ route.ts
│  │  │  ├─ profile
│  │  │  │  └─ route.ts
│  │  │  ├─ public
│  │  │  │  ├─ avatar
│  │  │  │  │  └─ [username]
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ [username]
│  │  │  │     └─ route.ts
│  │  │  ├─ settings
│  │  │  │  └─ route.ts
│  │  │  ├─ stripe
│  │  │  │  ├─ checkout
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ portal
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ verify-session
│  │  │  │     └─ route.ts
│  │  │  ├─ themes
│  │  │  │  └─ save
│  │  │  │     └─ route.ts
│  │  │  ├─ unsplash
│  │  │  │  └─ route.ts
│  │  │  ├─ upload
│  │  │  │  ├─ profile-image
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ wallet
│  │  │  │  ├─ apple
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ google
│  │  │  │     └─ route.ts
│  │  │  └─ webhooks
│  │  │     └─ stripe
│  │  │        └─ route.ts
│  │  ├─ business
│  │  │  └─ page.tsx
│  │  ├─ c
│  │  │  └─ [cardCode]
│  │  │     └─ page.tsxf
│  │  ├─ checkout
│  │  │  └─ premium
│  │  │     └─ page.tsx
│  │  ├─ contact
│  │  │  └─ page.tsx
│  │  ├─ dashboard
│  │  │  ├─ analytics
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ forgot-password
│  │  │  └─ page.tsx
│  │  ├─ get-started
│  │  │  └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ not-found.tsx
│  │  ├─ order
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ privacy
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ settings
│  │  │  │  └─ page.tsx
│  │  │  └─ themes
│  │  │     └─ page.tsx
│  │  ├─ register
│  │  │  └─ activate
│  │  │     └─ page.tsx
│  │  ├─ reset-password
│  │  │  └─ page.tsx
│  │  ├─ social
│  │  │  └─ page.tsx
│  │  ├─ terms
│  │  │  └─ page.tsx
│  │  ├─ u
│  │  │  └─ [username]
│  │  │     └─ page.tsx
│  │  ├─ verify
│  │  │  └─ route.ts
│  │  ├─ verify-resend
│  │  │  └─ page.tsx
│  │  └─ verify-sent
│  │     └─ page.tsx
│  ├─ auth.ts
│  ├─ components
│  │  ├─ admin
│  │  │  ├─ order-actions.tsx
│  │  │  ├─ packing-slip.tsx
│  │  │  └─ product-manager.tsx
│  │  ├─ ads
│  │  │  └─ google-adsense.tsx
│  │  ├─ analytics
│  │  │  └─ trackers.tsx
│  │  ├─ auth
│  │  │  ├─ login-form.tsx
│  │  │  └─ register-form.tsx
│  │  ├─ avatar-uploader.tsx
│  │  ├─ card-preview-3d.tsx
│  │  ├─ cookie-banner.tsx
│  │  ├─ dashboard
│  │  │  ├─ accordion.tsx
│  │  │  ├─ add-link-form.tsx
│  │  │  ├─ analytics-view.tsx
│  │  │  ├─ business
│  │  │  │  ├─ business-profile-form.tsx
│  │  │  │  └─ business-view.tsx
│  │  │  ├─ dashboard-shell.tsx
│  │  │  ├─ globe.tsx
│  │  │  ├─ links-workspace.tsx
│  │  │  ├─ profile-preview-modal.tsx
│  │  │  ├─ public-profile-card.tsx
│  │  │  └─ social
│  │  │     ├─ social-profile-form.tsx
│  │  │     └─ social-view.tsx
│  │  ├─ file-upload-button.tsx
│  │  ├─ footer.tsx
│  │  ├─ get-started-view.tsx
│  │  ├─ icons
│  │  │  └─ social-icons.tsx
│  │  ├─ link-card.tsx
│  │  ├─ links-list.tsx
│  │  ├─ live-profile-demo.tsx
│  │  ├─ navbar-client.tsx
│  │  ├─ navbar.tsx
│  │  ├─ order-view.tsx
│  │  ├─ premium-checkout-form.tsx
│  │  ├─ profile
│  │  │  ├─ account-form.tsx
│  │  │  ├─ billing-view.tsx
│  │  │  ├─ cards-view.tsx
│  │  │  ├─ profile-settings-form.tsx
│  │  │  └─ settings-tabs.tsx
│  │  ├─ profile-card.tsx
│  │  ├─ profile-preview.tsx
│  │  ├─ providers
│  │  │  ├─ consent-manager.tsx
│  │  │  └─ session-provider.tsx
│  │  ├─ public-profile
│  │  │  ├─ business-profile.tsx
│  │  │  └─ social-profile.tsx
│  │  ├─ sign-in-button.tsx
│  │  ├─ sign-out-button.tsx
│  │  ├─ theme-selector.tsx
│  │  └─ themes
│  │     ├─ image-uploader.tsx
│  │     ├─ media-manager.tsx
│  │     ├─ tabs
│  │     │  ├─ background-tab.tsx
│  │     │  ├─ buttons-tab.tsx
│  │     │  ├─ profile-tab.tsx
│  │     │  └─ templates-tab.tsx
│  │     ├─ theme-controls.tsx
│  │     ├─ theme-editor.tsx
│  │     ├─ unsplash-picker.tsx
│  │     └─ upgrade-modal.tsx
│  ├─ data
│  │  ├─ theme-templates-business.ts
│  │  └─ theme-templates-social.ts
│  ├─ lib
│  │  ├─ crop-image.ts
│  │  ├─ email.ts
│  │  ├─ password.ts
│  │  ├─ prisma.ts
│  │  ├─ products.ts
│  │  ├─ session.ts
│  │  └─ stripe.ts
│  ├─ middleware.ts
│  ├─ types
│  │  ├─ next-auth.d.ts
│  │  └─ theme.ts
│  └─ utils
│     ├─ platform.ts
│     ├─ theme.ts
│     └─ __tests__
│        └─ theme.test.ts
├─ tailwind.config.js
├─ tsconfig.json
├─ tsconfig.tsbuildinfo
└─ vitest.config.ts

```
```
SocialCard-Next.js
├─ .eslintrc.json
├─ next-env.d.ts
├─ next.config.mjs
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ postcss.config.mjs
├─ prisma
│  ├─ migrations
│  │  ├─ 20251120214444_add_email_verification
│  │  │  └─ migration.sql
│  │  ├─ 20251124212821_add_contact_fields
│  │  │  └─ migration.sql
│  │  ├─ 20251129001129_add_redirect_enabled
│  │  │  └─ migration.sql
│  │  ├─ 20251130224209_add_profile_mode_to_user
│  │  │  └─ migration.sql
│  │  ├─ 20251203203949_add_business_profile_fields
│  │  │  └─ migration.sql
│  │  └─ migration_lock.toml
│  ├─ schema.prisma
│  └─ seed.ts
├─ public
│  ├─ ads.txt
│  ├─ default-profile.png
│  ├─ media
│  │  └─ socialcard-demo.mp4
│  └─ wallet
│     ├─ icon.png
│     └─ logo.png
├─ README.md
├─ src
│  ├─ actions
│  │  ├─ admin.ts
│  │  └─ reset-password.ts
│  ├─ app
│  │  ├─ (auth)
│  │  │  ├─ login
│  │  │  │  └─ page.tsx
│  │  │  └─ register
│  │  │     └─ page.tsx
│  │  ├─ activate
│  │  │  ├─ confirm
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ admin
│  │  │  ├─ orders
│  │  │  │  └─ [id]
│  │  │  │     └─ page.tsx
│  │  │  ├─ page.tsx
│  │  │  ├─ products
│  │  │  │  └─ page.tsx
│  │  │  └─ users
│  │  │     ├─ page.tsx
│  │  │     └─ [id]
│  │  │        └─ page.tsx
│  │  ├─ api
│  │  │  ├─ account
│  │  │  │  └─ route.ts
│  │  │  ├─ admin
│  │  │  │  ├─ discounts
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ orders
│  │  │  │  │  └─ [id]
│  │  │  │  │     ├─ generate
│  │  │  │  │     │  └─ route.ts
│  │  │  │  │     └─ status
│  │  │  │  │        └─ route.ts
│  │  │  │  └─ products
│  │  │  │     └─ route.ts
│  │  │  ├─ analytics
│  │  │  │  └─ route.ts
│  │  │  ├─ auth
│  │  │  │  ├─ register
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ resend-verification
│  │  │  │     └─ route.ts
│  │  │  ├─ cards
│  │  │  │  └─ claim
│  │  │  │     └─ route.ts
│  │  │  ├─ links
│  │  │  │  ├─ reorder
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ route.ts
│  │  │  │  └─ [id]
│  │  │  │     └─ route.ts
│  │  │  ├─ me
│  │  │  │  └─ route.ts
│  │  │  ├─ profile
│  │  │  │  └─ route.ts
│  │  │  ├─ public
│  │  │  │  ├─ avatar
│  │  │  │  │  └─ [username]
│  │  │  │  │     └─ route.ts
│  │  │  │  └─ [username]
│  │  │  │     └─ route.ts
│  │  │  ├─ settings
│  │  │  │  └─ route.ts
│  │  │  ├─ stripe
│  │  │  │  ├─ checkout
│  │  │  │  │  └─ route.ts
│  │  │  │  ├─ portal
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ verify-session
│  │  │  │     └─ route.ts
│  │  │  ├─ themes
│  │  │  │  └─ save
│  │  │  │     └─ route.ts
│  │  │  ├─ unsplash
│  │  │  │  └─ route.ts
│  │  │  ├─ upload
│  │  │  │  ├─ profile-image
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ route.ts
│  │  │  ├─ wallet
│  │  │  │  ├─ apple
│  │  │  │  │  └─ route.ts
│  │  │  │  └─ google
│  │  │  │     └─ route.ts
│  │  │  └─ webhooks
│  │  │     └─ stripe
│  │  │        └─ route.ts
│  │  ├─ business
│  │  │  └─ page.tsx
│  │  ├─ c
│  │  │  └─ [cardCode]
│  │  │     └─ page.tsx
│  │  ├─ checkout
│  │  │  └─ premium
│  │  │     └─ page.tsx
│  │  ├─ contact
│  │  │  └─ page.tsx
│  │  ├─ dashboard
│  │  │  ├─ analytics
│  │  │  │  └─ page.tsx
│  │  │  └─ page.tsx
│  │  ├─ forgot-password
│  │  │  └─ page.tsx
│  │  ├─ get-started
│  │  │  └─ page.tsx
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  ├─ not-found.tsx
│  │  ├─ order
│  │  │  └─ page.tsx
│  │  ├─ page.tsx
│  │  ├─ privacy
│  │  │  └─ page.tsx
│  │  ├─ profile
│  │  │  ├─ settings
│  │  │  │  └─ page.tsx
│  │  │  └─ themes
│  │  │     └─ page.tsx
│  │  ├─ register
│  │  │  └─ activate
│  │  │     └─ page.tsx
│  │  ├─ reset-password
│  │  │  └─ page.tsx
│  │  ├─ social
│  │  │  └─ page.tsx
│  │  ├─ terms
│  │  │  └─ page.tsx
│  │  ├─ u
│  │  │  └─ [username]
│  │  │     └─ page.tsx
│  │  ├─ verify
│  │  │  └─ route.ts
│  │  ├─ verify-resend
│  │  │  └─ page.tsx
│  │  └─ verify-sent
│  │     └─ page.tsx
│  ├─ auth.ts
│  ├─ components
│  │  ├─ admin
│  │  │  ├─ order-actions.tsx
│  │  │  ├─ packing-slip.tsx
│  │  │  └─ product-manager.tsx
│  │  ├─ ads
│  │  │  └─ google-adsense.tsx
│  │  ├─ analytics
│  │  │  └─ trackers.tsx
│  │  ├─ auth
│  │  │  ├─ login-form.tsx
│  │  │  └─ register-form.tsx
│  │  ├─ avatar-uploader.tsx
│  │  ├─ card-preview-3d.tsx
│  │  ├─ cookie-banner.tsx
│  │  ├─ dashboard
│  │  │  ├─ accordion.tsx
│  │  │  ├─ add-link-form.tsx
│  │  │  ├─ analytics-view.tsx
│  │  │  ├─ business
│  │  │  │  ├─ business-profile-form.tsx
│  │  │  │  └─ business-view.tsx
│  │  │  ├─ dashboard-shell.tsx
│  │  │  ├─ globe.tsx
│  │  │  ├─ links-workspace.tsx
│  │  │  ├─ profile-preview-modal.tsx
│  │  │  ├─ public-profile-card.tsx
│  │  │  └─ social
│  │  │     ├─ social-profile-form.tsx
│  │  │     └─ social-view.tsx
│  │  ├─ file-upload-button.tsx
│  │  ├─ footer.tsx
│  │  ├─ get-started-view.tsx
│  │  ├─ icons
│  │  │  └─ social-icons.tsx
│  │  ├─ link-card.tsx
│  │  ├─ links-list.tsx
│  │  ├─ live-profile-demo.tsx
│  │  ├─ navbar-client.tsx
│  │  ├─ navbar.tsx
│  │  ├─ order-view.tsx
│  │  ├─ premium-checkout-form.tsx
│  │  ├─ profile
│  │  │  ├─ account-form.tsx
│  │  │  ├─ billing-view.tsx
│  │  │  ├─ cards-view.tsx
│  │  │  ├─ profile-settings-form.tsx
│  │  │  └─ settings-tabs.tsx
│  │  ├─ profile-card.tsx
│  │  ├─ profile-preview.tsx
│  │  ├─ providers
│  │  │  ├─ consent-manager.tsx
│  │  │  └─ session-provider.tsx
│  │  ├─ public-profile
│  │  │  ├─ business-profile.tsx
│  │  │  └─ social-profile.tsx
│  │  ├─ sign-in-button.tsx
│  │  ├─ sign-out-button.tsx
│  │  ├─ theme-selector.tsx
│  │  └─ themes
│  │     ├─ image-uploader.tsx
│  │     ├─ media-manager.tsx
│  │     ├─ tabs
│  │     │  ├─ background-tab.tsx
│  │     │  ├─ buttons-tab.tsx
│  │     │  ├─ profile-tab.tsx
│  │     │  └─ templates-tab.tsx
│  │     ├─ theme-controls.tsx
│  │     ├─ theme-editor.tsx
│  │     ├─ unsplash-picker.tsx
│  │     └─ upgrade-modal.tsx
│  ├─ data
│  │  ├─ theme-templates-business.ts
│  │  └─ theme-templates-social.ts
│  ├─ lib
│  │  ├─ crop-image.ts
│  │  ├─ email.ts
│  │  ├─ password.ts
│  │  ├─ prisma.ts
│  │  ├─ products.ts
│  │  ├─ session.ts
│  │  └─ stripe.ts
│  ├─ middleware.ts
│  ├─ types
│  │  ├─ next-auth.d.ts
│  │  └─ theme.ts
│  └─ utils
│     ├─ platform.ts
│     ├─ theme.ts
│     └─ __tests__
│        └─ theme.test.ts
├─ tailwind.config.js
├─ tsconfig.json
├─ tsconfig.tsbuildinfo
└─ vitest.config.ts

```