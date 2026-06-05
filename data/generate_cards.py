import json
import random
import os

def generate_card():
    card = {
        "B": random.sample(range(1, 16), 5),
        "I": random.sample(range(16, 31), 5),
        "N": random.sample(range(31, 46), 5),
        "G": random.sample(range(46, 61), 5),
        "O": random.sample(range(61, 76), 5),
    }
    # Center space is FREE
    card["N"][2] = "FREE"
    return card

def main():
    num_cards = 100
    cards = {}
    for i in range(1, num_cards + 1):
        card_id = f"card_{i:03d}"
        cards[card_id] = generate_card()
    
    # Save to data/cards.json
    script_dir = os.path.dirname(os.path.abspath(__file__))
    output_path = os.path.join(script_dir, "cards.json")
    
    with open(output_path, "w") as f:
        json.dump(cards, f, indent=2)
    
    print(f"Generated {num_cards} valid Bingo cards at {output_path}")

if __name__ == "__main__":
    main()
