# PMD FC Portal (GitHub Pages)
Upload seluruh isi folder ini ke root repo (index.html, assets/, content/).
- Ubah tampilan: assets/style.css | logika & API_URL: assets/app.js
- Materi: content/*.html (dimuat saat kartu dibuka)
- Kartu dashboard: tab "apps" di Sheet (lihat apps-script-snippet.gs); cadangan: content/apps.json
- Lokasi cuaca bawaan: DEFAULT_LOC di assets/app.js
- Setelah mengubah css/js, naikkan angka ?v=1 di index.html agar cache browser diperbarui.
Catatan: halaman harus dibuka lewat http(s) (GitHub Pages), bukan dobel-klik file, karena materi di-fetch.
