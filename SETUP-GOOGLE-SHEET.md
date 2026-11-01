# Thikana Estates: Google Sheet setup (no coding)

Your whole website is run from one Google Sheet.
You change the sheet, and the website changes. You do not touch any code after the setup.

**Good to know:** until you finish this guide, the website shows built-in DEMO homes. That is normal.

---

## Part 1: Set up the sheet (about 10 minutes)

1. Go to **sheets.google.com** and make a **new blank spreadsheet**. Name it `Thikana Estates`.
2. Click **Extensions** then **Apps Script**. A new page opens.
3. Delete everything in the big white box.
4. Open the file `google-apps-script.gs` from this folder. Copy **all** of it and paste it into the white box.
5. Click the **Save** icon (a small disk).
6. At the top, next to **Run**, choose the function called **setup**.
7. Click **Run**. Google asks for permission:
   - Click **Review permissions**, choose your Google account.
   - If you see "Google hasn't verified this app", click **Advanced**, then **Go to (project name) (unsafe)**, then **Allow**. This is your own script, so it is safe.
8. Wait a few seconds. Go back to your sheet. You now have 4 tabs:
   **Properties**, **Areas**, **Leads**, **Settings**. They already hold sample homes, areas and settings.

---

## Part 2: Put the sheet on the internet ("Deploy")

1. In Apps Script, click the blue **Deploy** button, then **New deployment**.
2. Click the small gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** `Thikana website`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **Deploy**. Allow permissions again if Google asks.
5. Copy the **Web app URL**. It ends with `/exec`.
6. Open the file `js/config.js` in this website folder.
   Paste the link between the quotes: `SCRIPT_URL: "paste-the-link-here",`
7. Save the file and upload the website again.

**Important:** if you ever change the script, click **Deploy** then **Manage deployments**, then the pencil icon, then **Version: New version**, then **Deploy**. The link stays the same.

**Location needs a secure website.** The "Use my location" button only works when the website address starts with `https://` (or when you test on `localhost`). Most free hosts (GitHub Pages, Netlify, Cloudflare Pages) give you `https` automatically.

---

## Part 3: Daily work

### Add a property
1. Open the **Properties** tab.
2. Go to the first empty row at the bottom.
3. Fill in the columns. Use the drop-down lists where you see a small arrow.
   - **Property ID:** the next number, like `TE-1061`. Never reuse or change an ID.
   - **Status:** `Available` (only Available shows on the website).
   - **Purpose:** `Sale` or `Rent`. For rent, **Price PKR** means the price **per month**.
   - **Type:** House, Plot, Flat, Commercial or Farmhouse.
   - **Title:** a short clear name, like `5 Marla Corner House in Johar Town`.
   - **Area:** pick from the list. It must match a name in the **Areas** tab.
   - **Block / Address:** for example `Block E, Street 12`.
   - **Latitude / Longitude:** see "Get Latitude and Longitude" below. If you leave them empty, the website uses the middle of the area.
   - **Price PKR:** numbers only, like `27500000` (no commas, no "Rs").
   - **Old Price PKR:** only if the price was lowered. The website then shows "Price dropped" and the old price crossed out. Leave empty otherwise.
   - **Size Value** and **Size Unit:** for example `5` and `Marla`, or `1` and `Kanal`, or `1100` and `Sq Ft`.
     The website knows: 1 marla = 272.25 sq ft, and 1 kanal = 20 marla.
   - **Bedrooms, Bathrooms, Floors:** numbers. Leave empty for plots.
   - **Furnished / Possession Ready / Featured / Verified:** `Yes` or `No`.
   - **Features:** words separated by commas, like `Corner, Park facing, Gas, Solar, Installments`.
   - **Description:** two or three simple sentences.
   - **Photo URLs / Video URL:** see below.
   - **Date Added:** today's date like `2026-11-01` (year-month-day). The website uses it for the "New" badge and for "new homes since your last visit".
4. Wait up to **5 minutes**. The website keeps the sheet for a few minutes so it stays fast. Then refresh the page.

### Get Latitude and Longitude
1. Open **Google Maps** in your browser (maps.google.com).
2. Find the property. **Right-click** exactly on the spot.
3. At the top of the little menu you see two numbers, like `31.47021, 74.27316`. **Click on the numbers.** They are copied.
4. Paste them in the sheet. The **first** number is **Latitude**. The **second** number is **Longitude**.
   Write them in two cells, without the comma.

### Add photos
1. Upload each photo somewhere that gives a **direct link** (for example Google Drive, Imgur or your own website).
2. For Google Drive: right-click the photo, **Share**, set it to **Anyone with the link**, then **Copy link**. You can paste that normal Drive link; the website fixes it.
3. In the **Photo URLs** cell, paste the links **separated by commas**. Up to **8** photos. The first photo is the main one.
4. Photos not ready yet? Leave it empty. The website shows a nice drawing instead.

### Add a video
Paste a YouTube link (or any web link) into **Video URL**. The page shows a "Watch the video tour" button.

### Mark a property Sold, Rented or Hidden
- In the **Status** column choose **Sold**, **Rented** or **Hidden**.
- The row turns grey and the property **disappears from the website** (after about 5 minutes).
- Do **not** delete the row. Keep it for your records. To bring it back, choose **Available** again.

### Add or change an area
1. Open the **Areas** tab.
2. Add a row: **Area** name, **City**, **Latitude** and **Longitude** of the middle of the area, a short **Description**, and four scores from **1 to 5**:
   - **Family score:** 5 = great for families.
   - **Budget score:** 5 = most affordable.
   - **Investment score:** 5 = best for investors.
   - **Central score:** 5 = closest to the city centre.
3. **Highlights:** words separated by commas, like `Good schools, Parks, Hospitals nearby, Shopping`.
4. The area name is used for the "near you" feature, the Area Guides page and the Area Match quiz.

### Handle leads (people who contact you)
Every form on the website adds a row to the **Leads** tab and sends you an **email** (to the Google account that owns the script). The email has all the details and a link to the sheet.

1. Open the **Leads** tab. New leads have **Status = New** (yellow).
2. Call the person. The row shows name, phone, property ID, details, preferred time and notes.
3. Change **Status** to **Contacted**, then **Done** when finished. The **Notes** column holds what the customer wrote, so keep your own notes in a new column **to the right** of the last column.
4. **Lead types:**
   - `Viewing`: wants to see a property.
   - `Question`: a general question.
   - `Alert`: wants to hear about new homes.
   - `Valuation`: wants a free valuation of their property.
   - `Sell/List`: wants to list their property with you.
5. The customer also gets a button to message you on **WhatsApp** with the same details. The WhatsApp number comes from the **Settings** tab.

### Change the phone, WhatsApp, address or defaults
Open the **Settings** tab and change the **Value** column:
- **Phone:** shown on the website.
- **WhatsApp Number:** numbers only, with country code, like `923001234567`.
- **Address** and **Opening Hours** (separate lines with a semicolon `;`).
- **Instalment Annual Rate / Down Payment / Years:** the starting numbers in the instalment calculator.
- **New Listing Days:** how many days a home shows the "New" badge.
- **Near Me Radius (km):** how far the "Near you" row on the Home page looks.

---

## The most important rule: NEVER MOVE COLUMNS

- **Do not** move, delete, rename or re-order any column.
- **Do not** change the names in row 1 (the green header row).
- **Do not** rename the 4 tabs.
- You **can** add your own extra columns **to the right** of the last column.
- Never put customer secrets or passwords in the **Settings** tab. The website can read everything in Settings, Properties and Areas.
- The **Leads** tab is **never** sent to the website. Customer names and phone numbers stay in your sheet only.

---

## Privacy (what the website does and does not keep)

- The visitor's **location** is worked out in their own browser, rounded, and kept only there. It is **never sent** to the script or the sheet.
- Saved homes, saved searches and the compare list are also kept **only in the visitor's browser**.
- The only things saved in your sheet are the details a visitor **types into a form** and sends.

---

## If something does not work

| Problem | What to do |
|---|---|
| The website still shows demo homes | `SCRIPT_URL` in `js/config.js` is empty or wrong. Paste the `/exec` link again. |
| "We could not reach our listings" | Check **Who has access** is **Anyone**. Open the `/exec` link in your browser: you should see text starting with `{"ok":true`. |
| A property does not appear | Is **Status** = `Available`? Is the **Price PKR** a number above 0? Is the **Title** filled? Wait 5 minutes and refresh. |
| A property is in the wrong place on the map | Check **Latitude** and **Longitude**. Latitude is about 31 and longitude about 74 for Lahore. |
| A photo does not show | The link must be public ("Anyone with the link"). Open it in a private browser window to test. |
| No email for new leads | Run any function once in Apps Script and allow permissions again. Free Google accounts can send about 100 emails a day. The lead is always saved in the **Leads** tab even if the email fails. |
| "Location does not work" | The site must be on `https://`. Also the visitor may have blocked location; they can pick their area instead. |
| I changed the script but nothing changed | Deploy a **New version** (see Part 2). |
