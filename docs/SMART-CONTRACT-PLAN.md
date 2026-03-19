# Smart Contract Plan — CertifyMe Certificate Registry

## 1. Tổng quan thiết kế

### Triết lý: Minimal On-Chain Storage

Mục tiêu là **tối thiểu hóa gas** bằng cách chỉ lưu những gì cần thiết để **xác minh tính xác thực** của bằng. Dữ liệu đầy đủ (tên sinh viên, khóa học, v.v.) vẫn nằm trong MySQL — smart contract chỉ đóng vai trò **anchor of trust** (neo xác thực).

**Nguyên tắc:** Nếu thông tin có thể suy ra từ hash hoặc không cần thiết cho verification → OFF-CHAIN.

---

## 2. Phân tích: On-Chain vs Off-Chain

### ✅ Lưu ON-CHAIN (tối thiểu, đủ để verify)

| Field       | Type      | Lý do                                                                                 |
| ----------- | --------- | ------------------------------------------------------------------------------------- |
| `certHash`  | `bytes32` | Key của mapping — chính là `certificate_hash` trong DB                                |
| `issuer`    | `address` | Địa chỉ ví tổ chức phát hành (tương đương `wallet_address` trong `organization_info`) |
| `issuedAt`  | `uint40`  | Timestamp cấp bằng — cần thiết để verify thời điểm hợp lệ                             |
| `revokedAt` | `uint40`  | Timestamp thu hồi (= 0 nếu chưa bị thu hồi)                                           |
| `isRevoked` | `bool`    | Trạng thái thu hồi — quan trọng nhất cho verification                                 |

> **Gas trick**: `address` (20 bytes) + `uint40` (5 bytes) + `uint40` (5 bytes) + `bool` (1 byte) = **31 bytes** → vừa khít **1 storage slot** (32 bytes). Tiết kiệm tối đa.

### ❌ Để OFF-CHAIN (trong MySQL)

| Field DB                  | Lý do không lên chain                                     |
| ------------------------- | --------------------------------------------------------- |
| `student_id`, tên, email  | PII — không nên public trên chain                         |
| `class_id`, `course_name` | Metadata — lấy từ DB khi cần                              |
| `expiration_date`         | Có thể tính từ business logic, không cần verify trực tiếp |
| `certificate_id`          | Internal ID của hệ thống                                  |
| `contract_address`        | Được lưu vào DB sau khi deploy                            |
| Template, QR code         | File, lưu IPFS hoặc DB                                    |

---

## 3. Cấu trúc Struct — Tối ưu 1 Storage Slot

```solidity
struct CertRecord {
    address issuer;    // 20 bytes  ─┐
    uint40  issuedAt;  //  5 bytes   │  1 storage slot (32 bytes)
    uint40  revokedAt; //  5 bytes   │  (31 bytes used)
    bool    isRevoked; //  1 byte   ─┘
}
```

> **Quan trọng**: Solidity pack struct theo thứ tự khai báo. Giữ đúng thứ tự trên để đảm bảo pack vào 1 slot. Nếu đổi thứ tự (ví dụ để `bool` lên đầu), compiler có thể tạo 2 slots → tốn gấp đôi gas khi write.

---

## 4. Các kỹ thuật tiết kiệm gas

### 4.1 Custom Errors thay vì `require` string

```solidity
// ❌ Tốn gas — string "Already issued" được encode vào calldata revert
require(certificates[certHash].issuedAt == 0, "Already issued");

// ✅ Rẻ hơn ~50 gas/lần revert — error chỉ là 4-byte selector
error AlreadyIssued(bytes32 certHash);
if (certificates[certHash].issuedAt != 0) revert AlreadyIssued(certHash);
```

**Tại sao rẻ hơn?** `require` khi revert phải ABI-encode toàn bộ chuỗi string vào `returndata`. Custom error chỉ encode 4-byte function selector (+ param nếu có). Tiết kiệm cả gas deploy lẫn gas runtime khi revert.

### 4.2 `immutable` cho biến đọc-nhiều-ghi-một

```solidity
// ❌ Mỗi lần đọc owner phải SLOAD (100 gas cold / 100 gas warm)
address public owner;

// ✅ immutable được nhúng thẳng vào bytecode, đọc = PUSH32 (3 gas)
address public immutable owner;
```

`immutable` phù hợp với `owner` vì chỉ gán 1 lần trong constructor, không bao giờ thay đổi.

### 4.3 `unchecked` cho loop counter

```solidity
// ❌ Solidity >=0.8 tự động check overflow — tốn thêm ~30 gas/iteration
for (uint256 i = 0; i < len; i++) { ... }

// ✅ Counter loop không thể overflow (gas limit chặn trước) → bỏ check an toàn
for (uint256 i = 0; i < len; ) {
    // ... logic ...
    unchecked { ++i }   // ++i rẻ hơn i++ (không cần temp variable)
}
```

### 4.4 Cache array length trước loop

```solidity
// ❌ Mỗi vòng lặp đọc lại certHashes.length từ memory (MLOAD)
for (uint256 i = 0; i < certHashes.length; ) { ... }

// ✅ Cache 1 lần vào stack variable — đọc từ stack (3 gas vs ~3-6 gas MLOAD)
uint256 len = certHashes.length;
for (uint256 i = 0; i < len; ) { ... }
```

### 4.5 `calldata` thay vì `memory` cho tham số array

```solidity
// ❌ memory: EVM copy toàn bộ array từ calldata vào memory (~3 gas/byte)
function issueBatch(bytes32[] memory certHashes) external { ... }

// ✅ calldata: đọc trực tiếp từ calldata, không copy
function issueBatch(bytes32[] calldata certHashes) external { ... }
```

### 4.6 `issuedAt != 0` làm existence check — không cần `bool exists`

Thay vì thêm field `bool exists` vào struct (tốn thêm 1 byte → có thể vỡ slot), dùng `issuedAt == 0` để biết bằng chưa được cấp. Timestamp `0` = Unix epoch 1970 → không bao giờ xảy ra trong thực tế.

### 4.7 Ghi struct 1 lần duy nhất (single SSTORE)

```solidity
// ❌ 4 lần SSTORE riêng lẻ (mỗi field 1 slot mới)
certificates[certHash].issuer    = msg.sender;
certificates[certHash].issuedAt  = uint40(block.timestamp);
certificates[certHash].revokedAt = 0;
certificates[certHash].isRevoked = false;

// ✅ 1 lần SSTORE duy nhất vì struct fit 1 slot
certificates[certHash] = CertRecord({
    issuer:    msg.sender,
    issuedAt:  uint40(block.timestamp),
    revokedAt: 0,
    isRevoked: false
});
```

### Tổng hợp tiết kiệm ước tính

| Kỹ thuật | Tiết kiệm / lần gọi |
|---|---|
| Custom error thay require string | ~50–200 gas khi revert |
| `immutable owner` | ~97 gas / lần đọc (SLOAD → PUSH) |
| `unchecked ++i` (batch 10) | ~300 gas |
| Cache array length (batch 10) | ~30–60 gas |
| `calldata` array (batch 10×32 bytes) | ~960 gas |
| Struct 1 SSTORE vs 4 SSTORE | ~60,000 gas (3 zero-slots tránh được) |

---

## 5. Contract Interface (đã áp dụng tất cả kỹ thuật)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CertifyMeRegistry {

    // ─── State ───────────────────────────────────────────────
    address public immutable owner;          // immutable: PUSH32 thay SLOAD
    mapping(address => bool) public isIssuer;
    mapping(bytes32 => CertRecord) public certificates;

    // ─── Struct (1 storage slot) ──────────────────────────────
    struct CertRecord {
        address issuer;    // 20 bytes ─┐
        uint40  issuedAt;  //  5 bytes  │  31 bytes → 1 slot
        uint40  revokedAt; //  5 bytes  │
        bool    isRevoked; //  1 byte  ─┘
    }

    // ─── Custom Errors (rẻ hơn require string ~50 gas/revert) ─
    error NotOwner();
    error NotIssuer();
    error AlreadyIssued(bytes32 certHash);
    error CertificateNotFound(bytes32 certHash);
    error AlreadyRevoked(bytes32 certHash);

    // ─── Events (indexing, không tốn storage) ─────────────────
    event CertificateIssued(
        bytes32 indexed certHash,
        address indexed issuer,
        uint40  issuedAt
    );
    event CertificateRevoked(
        bytes32 indexed certHash,
        address indexed revokedBy,
        uint40  revokedAt
    );
    event IssuerUpdated(address indexed account, bool status);

    // ─── Modifiers ────────────────────────────────────────────
    modifier onlyOwner()  { if (msg.sender != owner)          revert NotOwner();  _; }
    modifier onlyIssuer() { if (!isIssuer[msg.sender])        revert NotIssuer(); _; }

    // ─── Constructor ──────────────────────────────────────────
    constructor() {
        owner = msg.sender;
        isIssuer[msg.sender] = true;
    }

    // ─── Admin Functions ──────────────────────────────────────

    function setIssuer(address account, bool status) external onlyOwner {
        isIssuer[account] = status;
        emit IssuerUpdated(account, status);
    }

    // ─── Core Functions ───────────────────────────────────────

    /// Cấp 1 bằng
    function issueCertificate(bytes32 certHash) external onlyIssuer {
        if (certificates[certHash].issuedAt != 0) revert AlreadyIssued(certHash);

        certificates[certHash] = CertRecord({
            issuer:    msg.sender,
            issuedAt:  uint40(block.timestamp),
            revokedAt: 0,
            isRevoked: false
        });

        emit CertificateIssued(certHash, msg.sender, uint40(block.timestamp));
    }

    /// Cấp nhiều bằng 1 lần — calldata array + unchecked loop + cached length
    function issueBatch(bytes32[] calldata certHashes) external onlyIssuer {
        uint40  ts  = uint40(block.timestamp);
        uint256 len = certHashes.length;           // cache: tránh MLOAD mỗi vòng

        for (uint256 i = 0; i < len; ) {
            bytes32 h = certHashes[i];
            if (certificates[h].issuedAt == 0) {   // skip duplicates
                certificates[h] = CertRecord({
                    issuer:    msg.sender,
                    issuedAt:  ts,
                    revokedAt: 0,
                    isRevoked: false
                });
                emit CertificateIssued(h, msg.sender, ts);
            }
            unchecked { ++i }                      // overflow không thể xảy ra
        }
    }

    /// Thu hồi bằng
    function revokeCertificate(bytes32 certHash) external onlyIssuer {
        CertRecord storage rec = certificates[certHash];
        if (rec.issuedAt == 0)  revert CertificateNotFound(certHash);
        if (rec.isRevoked)      revert AlreadyRevoked(certHash);

        rec.isRevoked = true;
        rec.revokedAt = uint40(block.timestamp);

        emit CertificateRevoked(certHash, msg.sender, uint40(block.timestamp));
    }

    // ─── View / Verify Functions (gas-free) ───────────────────

    function getCertificate(bytes32 certHash)
        external view
        returns (CertRecord memory)
    {
        return certificates[certHash];
    }

    function isValid(bytes32 certHash) external view returns (bool) {
        CertRecord storage rec = certificates[certHash];
        return rec.issuedAt != 0 && !rec.isRevoked;
    }
}
```

---

## 6. Flow tích hợp Backend ↔ Smart Contract

```
[Backend Java]                    [Blockchain]
      │                                │
      │  1. Teacher/Admin cấp bằng     │
      │  → Tính certificate_hash       │
      │    (SHA-256 of key fields)     │
      │                                │
      │  2. Gọi issueCertificate()  ──►│
      │     hoặc issueBatch()          │  Smart Contract lưu
      │                                │  CertRecord vào mapping
      │  3. Nhận tx_hash, block_number │
      │◄──────────────────────────────│
      │                                │
      │  4. Cập nhật DB:               │
      │     status = 'ISSUED'          │
      │     transaction_hash = tx_hash │
      │     block_number = block_num   │
      │     contract_address = addr    │
      │                                │
      │  5. Verify (khi cần):          │
      │     Gọi isValid(hash) ────────►│
      │◄────────────────── true/false ─│
```

---

## 7. Tính toán certificate_hash

Hash được tính **off-chain** (ở backend Java) trước khi gửi lên chain. Đây là những field đưa vào hash:

```
SHA-256(
  certificate_id +
  student_id +
  class_id +
  issue_date.toString() +
  org_code          ← từ bảng organization_info
)
```

Kết quả là 32 bytes → format thành `0x` + 64 hex chars = `VARCHAR(66)` khớp với schema DB.

> **Không** đưa `expiration_date` vào hash vì nếu tổ chức cần gia hạn bằng, hash sẽ thay đổi — cần cấp lại bằng mới trên chain.

---

## 8. Gas Estimation

| Operation                    | Gas (ước tính) | Ghi chú                                     |
| ---------------------------- | -------------- | ------------------------------------------- |
| Deploy contract              | ~500,000       | 1 lần duy nhất                              |
| `issueCertificate`           | ~45,000        | 1 SSTORE mới (1 slot)                       |
| `issueBatch` (10 certs)      | ~380,000       | ~38,000/cert — tiết kiệm ~15% so với gọi lẻ |
| `revokeCertificate`          | ~25,000        | Modify slot có sẵn (SSTORE warm)            |
| `isValid` / `getCertificate` | 0              | View function — free                        |

---

## 9. Lựa chọn Network

| Network                      | Chi phí               | Phù hợp                      |
| ---------------------------- | --------------------- | ---------------------------- |
| Ethereum Mainnet             | Cao                   | Không nên (đồ án)            |
| **Polygon Mumbai (testnet)** | **Free**              | **Demo / Dev — khuyến nghị** |
| **Polygon Mainnet**          | Rất thấp (~$0.001/tx) | Production nếu cần thật      |
| Sepolia (ETH testnet)        | Free                  | Thay thế Mumbai              |
| Arbitrum Sepolia             | Free                  | Thay thế nếu cần EVM L2      |

---

## 10. Cấu trúc file đề xuất

```
CertifyMe-Web2.5/
├── CertifyMe-Web2.5-BE/          ← repo này
│   └── docs/
│       └── SMART-CONTRACT-PLAN.md  ← file này
│
└── CertifyMe-Web2.5-Contract/    ← repo mới (Hardhat project)
    ├── contracts/
    │   └── CertifyMeRegistry.sol
    ├── scripts/
    │   ├── deploy.js
    │   └── issue.js
    ├── test/
    │   └── CertifyMeRegistry.test.js
    ├── hardhat.config.js
    └── .env                      ← PRIVATE_KEY, RPC_URL
```

---

## 11. Yêu cầu implement tiếp theo

### Backend Java

- [ ] `CertificateService.java` — tính `certificate_hash` từ các field
- [ ] `Web3Service.java` (dùng Web3j) — gọi `issueCertificate` / `issueBatch` / `isValid`
- [ ] `CertificateController.java` — endpoint cấp bằng, thu hồi, verify
- [ ] Update DB: sau khi tx confirmed → set `status = ISSUED`, lưu `transaction_hash`, `block_number`

### Smart Contract (Hardhat)

- [ ] Viết `CertifyMeRegistry.sol` theo interface ở mục 5
- [ ] Viết unit test (Happy path + edge cases: duplicate, revoke twice, unauthorized)
- [ ] Script deploy lên testnet
- [ ] Export ABI → đưa vào BE để Web3j generate wrapper

### Frontend

- [ ] Trang verify bằng: nhập `certificate_hash` → gọi BE → hiển thị kết quả
- [ ] Hiển thị `transaction_hash` kèm link Polygonscan/Etherscan

---

## 12. Lưu ý bảo mật

1. **Private key của issuer** không được hardcode trong BE — dùng biến môi trường (`ISSUER_PRIVATE_KEY` trong `.env`)
2. **Không lưu PII lên chain** — chỉ hash, không tên/email sinh viên
3. `isIssuer` mapping giới hạn ai được gọi `issueCertificate` — chỉ wallet của backend
4. Sau khi deploy, **chạy test verify** trước khi cấp bằng thật để đảm bảo address đúng
5. Lưu `contract_address` vào `.env` của BE — không hardcode trong source code
