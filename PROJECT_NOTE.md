# Attendance Web App - Project Note

## Project Location
- **Folder**: `/Users/williamso/Documents/attendance`
- **Main File**: `index.html` (single-page app, all code in one file)
- **Apps Script**: `AppsScript_Code.js` (Google Sheets backend for saving records)

## Live Site
- **GitHub Pages URL**: https://williammtso-svg.github.io/lfc-attendance/
- ~~Netlify Site ID~~: (credits exhausted - switched to GitHub Pages)

## Deployment
- **Platform**: GitHub Pages (free hosting)
- **Auto-deploy**: Enabled on push to main branch

## Student Data Structure
- Student list is stored in `index.html` as a JS object: `const TUTOR_DATA = { ... };`
- Structure:
  ```
  TUTOR_DATA = {
    "Tutor Name": {
      "Instrument/Class Name": {
        "time": "HH:MM-HH:MM",
        "room": "Room Number",
        "students": [
          {"class_no": "2J23", "name": "學生姓名"},
          ...
        ]
      }
    }
  }
  ```
- Current data: 11 tutors, 27 classes, 119 students

## How to Update Student List
1. Provide new student data (markdown table, Excel, or plain text with tutor -> students mapping)
2. Replace the `const TUTOR_DATA = { ... };` block in `index.html`
3. Redeploy to Netlify using the deploy command above

## Data Source
- Original Excel: `/Users/williamso/Desktop/31012026-Absence Report.xlsx`
- School: 保良局 (Po Leung Kuk) - Music instrument interest classes
