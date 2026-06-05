def check_pattern(card, called_numbers, pattern):
    """
    Checks if a given card wins a specific pattern.
    card: dict with keys 'B', 'I', 'N', 'G', 'O', each a list of 5 numbers (or 'FREE' in the middle of 'N').
    called_numbers: set of integers currently called.
    pattern: string representing the winning pattern.
    """
    columns = ['B', 'I', 'N', 'G', 'O']
    
    def is_marked(col, row):
        val = card[col][row]
        if val == "FREE":
            return True
        return int(val) in called_numbers

    if pattern == "four_corners":
        corners = [("B", 0), ("B", 4), ("O", 0), ("O", 4)]
        return all(is_marked(col, row) for col, row in corners)

    elif pattern == "full_house":
        for col in columns:
            for row in range(5):
                if not is_marked(col, row):
                    return False
        return True

    elif pattern == "straight_line":
        # Check verticals (columns)
        for col in columns:
            if all(is_marked(col, row) for row in range(5)): return True
        # Check horizontals (rows)
        for row in range(5):
            if all(is_marked(col, row) for col in columns): return True
        # Check diagonals
        if all(is_marked(columns[i], i) for i in range(5)): return True
        if all(is_marked(columns[i], 4 - i) for i in range(5)): return True
        return False

    elif pattern == "letter_x":
        diag1 = all(is_marked(columns[i], i) for i in range(5))
        diag2 = all(is_marked(columns[i], 4 - i) for i in range(5))
        return diag1 and diag2

    elif pattern == "letter_t":
        # Top row and middle column
        top_row = all(is_marked(col, 0) for col in columns)
        mid_col = all(is_marked('N', row) for row in range(5))
        return top_row and mid_col

    elif pattern == "letter_l":
        # Leftmost column (B) and bottom row
        left_col = all(is_marked('B', row) for row in range(5))
        bottom_row = all(is_marked(col, 4) for col in columns)
        return left_col and bottom_row

    elif pattern == "cross":
        # Middle row and middle column
        mid_row = all(is_marked(col, 2) for col in columns)
        mid_col = all(is_marked('N', row) for row in range(5))
        return mid_row and mid_col

    elif pattern == "postage_stamp":
        # Any 2x2 corner square
        top_left = is_marked('B',0) and is_marked('B',1) and is_marked('I',0) and is_marked('I',1)
        top_right = is_marked('G',0) and is_marked('G',1) and is_marked('O',0) and is_marked('O',1)
        bottom_left = is_marked('B',3) and is_marked('B',4) and is_marked('I',3) and is_marked('I',4)
        bottom_right = is_marked('G',3) and is_marked('G',4) and is_marked('O',3) and is_marked('O',4)
        return top_left or top_right or bottom_left or bottom_right

    return False
