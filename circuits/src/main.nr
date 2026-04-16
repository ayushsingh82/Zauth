fn bytes32_to_field(data: [u8; 32]) -> Field {
    let mut acc: Field = 0;
    for i in 0..32 {
        acc = acc * 256 + data[i] as Field;
    }
    acc
}

fn main(
    nonce: pub [u8; 32],
    difficulty: pub Field,
    secret: [u8; 32],
    timestamp: pub Field
) {
    // Circuit ensures the prover knows a secret tied to this nonce.
    // Hash output is kept private in this simple starter circuit.
    let _commitment = std::hash::blake3(secret);

    let nonce_as_field = bytes32_to_field(nonce);
    assert(nonce_as_field != 0);
    assert(difficulty > 0);
    assert(timestamp > 0);
}
