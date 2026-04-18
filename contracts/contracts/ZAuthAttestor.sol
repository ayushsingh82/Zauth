// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IZAuthVerifier {
    function verifyProof(
        uint256[2] calldata _pA,
        uint256[2][2] calldata _pB,
        uint256[2] calldata _pC,
        uint256[4] calldata _pubSignals
    ) external view returns (bool);
}

/// @notice Thin attestation wrapper around the Groth16 verifier. Calling
/// `attest` produces a real transaction on HashKey Chain so the
/// verification is auditable via the block explorer. The contract also
/// prevents nonce replay: each challenge nonce can be attested to exactly
/// once, which lines up with the off-chain verifier-server single-use
/// challenge semantics.
contract ZAuthAttestor {
    IZAuthVerifier public immutable verifier;

    /// nonce (public signal #3) -> whether it has already been attested.
    mapping(uint256 => bool) public consumed;

    event ProofAttested(
        address indexed submitter,
        uint256 indexed nonce,
        uint256 expiry,
        uint256 commitment,
        uint256 powHash
    );

    error AlreadyAttested(uint256 nonce);
    error InvalidProof();
    error Expired(uint256 expiry, uint256 blockTs);

    constructor(address _verifier) {
        verifier = IZAuthVerifier(_verifier);
    }

    /// pubSignals layout matches the circom circuit output order:
    ///   [0] commitment, [1] powHash, [2] nonce, [3] expiry
    function attest(
        uint256[2] calldata a,
        uint256[2][2] calldata b,
        uint256[2] calldata c,
        uint256[4] calldata pubSignals
    ) external {
        uint256 commitment = pubSignals[0];
        uint256 powHash = pubSignals[1];
        uint256 nonce = pubSignals[2];
        uint256 expiry = pubSignals[3];

        if (block.timestamp > expiry) revert Expired(expiry, block.timestamp);
        if (consumed[nonce]) revert AlreadyAttested(nonce);
        if (!verifier.verifyProof(a, b, c, pubSignals)) revert InvalidProof();

        consumed[nonce] = true;
        emit ProofAttested(msg.sender, nonce, expiry, commitment, powHash);
    }
}
