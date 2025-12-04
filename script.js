// Konfigurasi Google Sheets - GANTI DENGAN DATA ANDA
const SPREADSHEET_ID = "1PlYtWISua88svLpf5HqVNCHxo89zrNiikrT6bSiDAfk"; // Ganti dengan ID spreadsheet Anda
const API_KEY = "AIzaSyDEif5uDoVmYUxrthp8AT1v3aurWdJgLfo"; // Ganti dengan API key Anda

// Data dummy untuk development (jika tidak menggunakan Google Sheets)
const DUMMY_DATA = [
  {
    id: "2023001",
    name: "Ahmad Fauzi",
    class: "X IPA 1",
    year: "2023/2024",
    status: "Aktif",
    monthlyData: [
      { month: "Januari", present: 20, absent: 1, permission: 0, sick: 0 },
      { month: "Februari", present: 18, absent: 0, permission: 1, sick: 1 },
      { month: "Maret", present: 22, absent: 0, permission: 0, sick: 0 },
      { month: "April", present: 19, absent: 1, permission: 1, sick: 0 },
    ],
  },
  {
    id: "2023002",
    name: "Siti Rahayu",
    class: "X IPA 2",
    year: "2023/2024",
    status: "Aktif",
    monthlyData: [
      { month: "Januari", present: 19, absent: 1, permission: 1, sick: 0 },
      { month: "Februari", present: 20, absent: 0, permission: 0, sick: 0 },
      { month: "Maret", present: 21, absent: 0, permission: 1, sick: 0 },
      { month: "April", present: 18, absent: 0, permission: 0, sick: 2 },
    ],
  },
];

// Fungsi untuk mengambil data dari Google Sheets
async function fetchSheetData(range) {
  // Jika menggunakan data dummy (untuk development)
  //   if (
  //     SPREADSHEET_ID === "1PlYtWISua88svLpf5HqVNCHxo89zrNiikrT6bSiDAfk" ||
  //     API_KEY === "AIzaSyDEif5uDoVmYUxrthp8AT1v3aurWdJgLfo"
  //   ) {
  //     console.log("Menggunakan data dummy untuk development");
  //     return null; // Akan menggunakan data dummy
  //   }

  try {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${range}?key=${API_KEY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.values;
  } catch (error) {
    console.error("Error fetching data:", error);
    alert(
      "Terjadi kesalahan saat mengambil data. Pastikan SPREADSHEET_ID dan API_KEY sudah benar."
    );
    return null;
  }
}

// Fungsi untuk mencari data siswa dari 1 sheet
async function searchStudent(studentId) {
  // Tampilkan loading spinner
  document.getElementById("loadingSpinner").style.display = "block";
  document.querySelector(".result-box").style.display = "none";

  try {
    // Coba ambil data dari Google Sheets
    const allData = await fetchSheetData("A2:J");

    let student;

    if (allData) {
      // Filter data untuk siswa dengan NIUP yang dicari
      const studentRecords = allData.filter((row) => row[0] === studentId);

      if (studentRecords.length === 0) {
        document.getElementById("loadingSpinner").style.display = "none";
        return null;
      }

      // Ambil data dasar siswa dari record pertama
      const firstRecord = studentRecords[0];
      student = {
        id: firstRecord[0],
        name: firstRecord[1],
        class: firstRecord[2],
        year: firstRecord[3],
        status: firstRecord[4],
        monthlyData: [],
      };

      // Proses data bulanan
      studentRecords.forEach((record) => {
        student.monthlyData.push({
          month: record[5],
          present: parseInt(record[6]) || 0,
          absent: parseInt(record[9]) || 0,
          permission: parseInt(record[8]) || 0,
          sick: parseInt(record[7]) || 0,
        });
      });
    } else {
      // Gunakan data dummy
      student = DUMMY_DATA.find((s) => s.id === studentId);
      if (!student) {
        document.getElementById("loadingSpinner").style.display = "none";
        return null;
      }
    }

    // Urutkan data bulanan berdasarkan nama bulan
    const monthOrder = [
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember",
    ];

    student.monthlyData.sort((a, b) => {
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    document.getElementById("loadingSpinner").style.display = "none";
    return student;
  } catch (error) {
    console.error("Error processing student data:", error);
    document.getElementById("loadingSpinner").style.display = "none";
    return null;
  }
}

// Fungsi untuk menghitung persentase kehadiran
function calculatePercentage(present, absent, permission, sick) {
  const total = present + absent + permission + sick;
  return total > 0 ? Math.round((present / total) * 100) : 0;
}

// Fungsi untuk membuat chart kehadiran
function createAttendanceChart(present, absent, permission, sick) {
  const total = present + absent + permission + sick;
  const presentPercent = total > 0 ? (present / total) * 100 : 0;
  const absentPercent = total > 0 ? (absent / total) * 100 : 0;
  const permissionPercent = total > 0 ? (permission / total) * 100 : 0;
  const sickPercent = total > 0 ? (sick / total) * 100 : 0;

  const maxHeight = 100;

  return `
        <div class="chart-bar bg-success" style="height: ${
          (presentPercent / 100) * maxHeight
        }%">
            <div class="chart-label">Hadir</div>
        </div>
        <div class="chart-bar bg-danger" style="height: ${
          (absentPercent / 100) * maxHeight
        }%">
            <div class="chart-label">Alpa</div>
        </div>
        <div class="chart-bar bg-warning" style="height: ${
          (permissionPercent / 100) * maxHeight
        }%">
            <div class="chart-label">Izin</div>
        </div>
        <div class="chart-bar bg-info" style="height: ${
          (sickPercent / 100) * maxHeight
        }%">
            <div class="chart-label">Sakit</div>
        </div>
    `;
}

// Fungsi untuk menghitung total statistik
function calculateTotalStats(monthlyData) {
  return monthlyData.reduce(
    (totals, month) => {
      totals.present += month.present;
      totals.absent += month.absent;
      totals.permission += month.permission;
      totals.sick += month.sick;
      return totals;
    },
    { present: 0, absent: 0, permission: 0, sick: 0 }
  );
}

// Fungsi untuk menampilkan data bulanan
function displayMonthlyData(monthlyData, activeMonthIndex = 0) {
  const monthlyDataContainer = document.getElementById("monthlyData");
  monthlyDataContainer.innerHTML = "";

  const monthData = monthlyData[activeMonthIndex];
  const percentage = calculatePercentage(
    monthData.present,
    monthData.absent,
    monthData.permission,
    monthData.sick
  );

  const monthCard = `
        <div class="card month-card fade-in">
            <div class="card-header month-card-header d-flex justify-content-between align-items-center">
                <span>Data Kehadiran Bulan <span class="badge badge-month">${
                  monthData.month
                }</span></span>
                <span class="text-muted">Persentase: ${percentage}%</span>
            </div>
            <div class="card-body">
                <div class="row">
                    <div class="col-md-6">
                        <table class="table table-borderless">
                            <tr>
                                <th width="60%">Kehadiran:</th>
                                <td>${monthData.present} jam</td>
                            </tr>
                            <tr>
                                <th>Alpa:</th>
                                <td>${monthData.absent} jam</td>
                            </tr>
                        </table>
                    </div>
                    <div class="col-md-6">
                        <table class="table table-borderless">
                            <tr>
                                <th width="60%">Izin:</th>
                                <td>${monthData.permission} jam</td>
                            </tr>
                            <tr>
                                <th>Sakit:</th>
                                <td>${monthData.sick} jam</td>
                            </tr>
                        </table>
                    </div>
                </div>
                
                <div class="row mt-4">
                    <div class="col-md-6">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <h5>Persentase Kehadiran</h5>
                                <div class="percentage-display">${percentage}%</div>
                                <div class="progress mt-3" style="height: 20px;">
                                    <div class="progress-bar ${
                                      percentage >= 80
                                        ? "bg-success"
                                        : percentage >= 60
                                        ? "bg-warning"
                                        : "bg-danger"
                                    }" 
                                         role="progressbar" style="width: ${percentage}%;" 
                                         aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card bg-light">
                            <div class="card-body">
                                <h5 class="text-center">Statistik Kehadiran</h5>
                                <div class="attendance-chart">
                                    ${createAttendanceChart(
                                      monthData.present,
                                      monthData.absent,
                                      monthData.permission,
                                      monthData.sick
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

  monthlyDataContainer.innerHTML = monthCard;
}

// Fungsi untuk membuat tombol pemilih bulan
function createMonthSelector(monthlyData, activeIndex = 0) {
  const monthSelector = document.getElementById("monthSelector");
  monthSelector.innerHTML = "";

  monthlyData.forEach((monthData, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `month-btn ${index === activeIndex ? "active" : ""}`;
    button.textContent = monthData.month;
    button.addEventListener("click", () => {
      document.querySelectorAll(".month-btn").forEach((btn) => {
        btn.classList.remove("active");
      });
      button.classList.add("active");
      displayMonthlyData(monthlyData, index);
    });

    monthSelector.appendChild(button);
  });
}

// Fungsi untuk reset pencarian
function resetSearch() {
  document.querySelector(".result-box").style.display = "none";
  document.getElementById("studentId").value = "";
  document.getElementById("studentId").focus();
}

// Event listener untuk form pencarian
document
  .getElementById("searchForm")
  .addEventListener("submit", async function (e) {
    e.preventDefault();

    const studentId = document.getElementById("studentId").value.trim();

    if (!studentId) {
      alert("Silakan masukkan NIUP santri");
      return;
    }

    const student = await searchStudent(studentId);

    if (student) {
      // Menampilkan data siswa
      document.getElementById("resultId").textContent = student.id;
      document.getElementById("resultName").textContent = student.name;
      document.getElementById("resultClass").textContent = student.class;
      document.getElementById("resultYear").textContent = student.year;
      document.getElementById("resultStatus").textContent = student.status;

      // Hitung dan tampilkan total statistik
      const totals = calculateTotalStats(student.monthlyData);
      document.getElementById("totalPresent").textContent = totals.present;
      document.getElementById("totalAbsent").textContent = totals.absent;
      document.getElementById("totalPermission").textContent =
        totals.permission;
      document.getElementById("totalSick").textContent = totals.sick;

      // Buat pemilih bulan
      createMonthSelector(student.monthlyData);

      // Tampilkan data bulan pertama
      displayMonthlyData(student.monthlyData);

      // Menampilkan hasil pencarian
      document.querySelector(".result-box").style.display = "block";
    } else {
      alert(
        "Data siswa tidak ditemukan. Silakan periksa kembali NIUP yang dimasukkan."
      );
    }
  });

// Focus ke input field saat halaman dimuat
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("studentId").focus();

  // Tambahkan event listener untuk tutup dengan ESC
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      resetSearch();
    }
  });
});
