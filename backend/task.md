# Refactor Duplicate Encryption Services

- [ ] Analyze `EncryptionUtil` vs `EncryptionService` <!-- id: 0 -->
- [ ] Identify all usages of `EncryptionUtil` <!-- id: 1 -->
- [ ] Identify all usages of `EncryptionService` <!-- id: 2 -->
- [ ] Choose the primary service (likely `EncryptionService` in SharedModule) <!-- id: 3 -->
- [ ] Refactor usages of `EncryptionUtil` to use `EncryptionService` <!-- id: 4 -->
- [ ] Delete `EncryptionUtil` <!-- id: 5 -->
- [ ] Verify `ConfigModule` loading for the remaining service <!-- id: 6 -->
- [ ] Verify build and startup <!-- id: 7 -->
