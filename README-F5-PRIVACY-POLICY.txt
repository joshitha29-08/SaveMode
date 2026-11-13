SaveMode F5 - Privacy Policy code patch

Copy these files into the matching paths in your SaveMode project, keeping the folder structure. This patch contains only the new/changed files.

Files:
- src/app/privacy.tsx (new /privacy route and in-app policy screen)
- src/components/PrivacyPolicyLink.tsx (new reusable link)
- src/app/(auth)/welcome.tsx (Welcome link)
- src/app/(tabs)/settings.tsx (Settings link)

The supplied project did not contain an About screen, so an About link is not included. Add PrivacyPolicyLink to About when that screen is available.

The policy includes the supplied content with the required reminder and App Lock permission explanations. The separate Data Sharing section has been omitted to follow the PRD instruction not to include shared or aggregated data-use wording.

Review before launch:
- This is a draft and requires White Pixel Technologies approval and lawyer review.
- Confirm the Supabase Mumbai region and actual service providers with the project team.
- Confirm the in-app account deletion option and deletion process are implemented before publishing this wording.
- Verify actual permission behavior and Android permissions before release.

To test: run npm install if needed, then npm run web. Open /privacy directly in the browser and check the Privacy Policy links on Welcome and Settings.
