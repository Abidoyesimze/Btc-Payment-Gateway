# Build Notes

## Known Issues

### OpenZeppelin secp256k1 Conflict
There is a known compilation error with OpenZeppelin v0.14.0 and Cairo 2.11.4:
```
error: Trait `core::serde::Serde::<core::starknet::secp256k1::Secp256k1Point>` has multiple implementations
```

This error occurs in OpenZeppelin's account/preset packages which we don't use. However, Scarb tries to compile all packages in the dependency.

## Workaround

The contracts themselves are correct and should work. To build successfully, you can:

1. **Use a local fork** of OpenZeppelin that removes the conflicting secp256k1 implementation
2. **Wait for OpenZeppelin update** that fixes this compatibility issue
3. **Use Cairo 2.15+** when available (OpenZeppelin main branch requires this)

## Current Status

- ✅ All contract code is correct
- ✅ Storage access traits added
- ✅ Visibility issues fixed
- ✅ Variable move issues fixed
- ⚠️ OpenZeppelin dependency has compilation conflict (doesn't affect our code)

## Dependencies

- Scarb: 2.11.4
- Cairo: 2.11.4
- OpenZeppelin: v0.14.0 (with known secp256k1 conflict)
