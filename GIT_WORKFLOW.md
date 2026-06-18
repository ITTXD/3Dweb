# Git Workflow สำหรับ 3Dweb

## Branch Strategy

```
main          ← โค้ดที่พร้อม deploy
  │
  ├── feature/*    ← ฟีเจอร์ใหม่
  ├── fix/*        ← แก้บั๊ก
  └── update/*     ← อัพเดท UI/UX
```

## เริ่มทำงานใหม่

```bash
# 1. สร้าง branch ใหม่
git checkout -b feature/ชื่อ-feature

# ตัวอย่าง
git checkout -b feature/add-cart
git checkout -b fix/bug-login
git checkout -b update/style-header
```

## แก้ไข + Commit

```bash
# 2. แก้ไขไฟล์ตามปกติ

# 3. ดูสถานะ
git status

# 4. เพิ่มไฟล์ที่แก้
git add .

# 5. Commit พร้อมข้อความที่มีความหมาย
git commit -m "feat: เพิ่มตะกร้าสินค้า"
git commit -m "fix: แก้บั๊ก login ไม่ทำงาน"
git commit -m "update: เปลี่ยนสี header"
```

## Push + Pull Request

```bash
# 6. Push ขึ้น GitHub
git push -u origin feature/ชื่อ-feature

# 7. ไปเปิด Pull Request บน GitHub
#    - เลือก main เป็น destination
#    - อธิบายสิ่งที่แก้
#    - กด Create pull request
```

## Merge + Cleanup

```bash
# 8. หลัง merge แล้ว
git checkout main
git pull
git branch -d feature/ชื่อ-feature
```

## Commit Message Format

```
<type>: <description>

Types:
- feat:     เพิ่มฟีเจอร์ใหม่
- fix:      แก้บั๊ก
- update:   อัพเดท UI/UX
- refactor: ปรับโครงสร้างโค้ด
- docs:     เอกสาร
- style:    จัดรูปแบบโค้ด
- test:     เพิ่ม/แก้ไข test
- chore:    งานบำรุงรักษา
```

## ตัวอย่าง

```bash
git checkout -b feature/add-product-page
git add .
git commit -m "feat: เพิ่มหน้าสินค้า"
git push -u origin feature/add-product-page
# เปิด PR บน GitHub แล้ว merge
git checkout main
git pull
git branch -d feature/add-product-page
```

## คำสั่งที่ใช้บ่อย

| คำสั่ง | ความหมาย |
|--------|-----------|
| `git status` | ดูสถานะ |
| `git log --oneline` | ดูประวัติสั้นๆ |
| `git diff` | ดูความแตกต่าง |
| `git stash` | เก็บงานชั่วคราว |
| `git stash pop` | เอางานกลับมา |
| `git branch` | ดู list branch |
| `git checkout -b <branch>` | สร้าง branch ใหม่ |
