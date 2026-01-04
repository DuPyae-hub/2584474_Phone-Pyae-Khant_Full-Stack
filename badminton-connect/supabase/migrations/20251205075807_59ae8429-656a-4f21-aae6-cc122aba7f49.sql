-- Create a function to update player stats when match is confirmed
CREATE OR REPLACE FUNCTION public.update_match_stats(
  p_match_id uuid,
  p_player1 uuid,
  p_player2 uuid,
  p_winner uuid,
  p_mode text,
  p_player1_exp_gain integer,
  p_player2_exp_gain integer,
  p_is_friendly boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_player1_profile RECORD;
  v_player2_profile RECORD;
  v_player1_won boolean;
BEGIN
  v_player1_won := (p_winner = p_player1);
  
  -- Get current profiles
  SELECT * INTO v_player1_profile FROM profiles WHERE id = p_player1;
  SELECT * INTO v_player2_profile FROM profiles WHERE id = p_player2;
  
  -- Update player1 profile
  UPDATE profiles SET
    experience_points = COALESCE(experience_points, 0) + p_player1_exp_gain,
    total_wins = COALESCE(total_wins, 0) + (CASE WHEN v_player1_won AND NOT p_is_friendly THEN 1 ELSE 0 END),
    total_losses = COALESCE(total_losses, 0) + (CASE WHEN NOT v_player1_won AND NOT p_is_friendly THEN 1 ELSE 0 END),
    total_matches_played = COALESCE(total_matches_played, 0) + 1,
    updated_at = now()
  WHERE id = p_player1;
  
  -- Update player2 profile
  UPDATE profiles SET
    experience_points = COALESCE(experience_points, 0) + p_player2_exp_gain,
    total_wins = COALESCE(total_wins, 0) + (CASE WHEN NOT v_player1_won AND NOT p_is_friendly THEN 1 ELSE 0 END),
    total_losses = COALESCE(total_losses, 0) + (CASE WHEN v_player1_won AND NOT p_is_friendly THEN 1 ELSE 0 END),
    total_matches_played = COALESCE(total_matches_played, 0) + 1,
    updated_at = now()
  WHERE id = p_player2;
  
  -- Update match experience_awarded
  UPDATE matches SET experience_awarded = p_player1_exp_gain WHERE id = p_match_id;
  
  -- Check for auto level-up (beginner beating intermediate 5 times)
  IF NOT p_is_friendly THEN
    DECLARE
      v_winner_level text;
      v_loser_level text;
      v_loser_id uuid;
      v_loser_new_losses integer;
      v_loser_exp integer;
      v_wins_against_intermediate integer;
    BEGIN
      v_loser_id := CASE WHEN v_player1_won THEN p_player2 ELSE p_player1 END;
      
      SELECT level INTO v_winner_level FROM profiles WHERE id = p_winner;
      SELECT level INTO v_loser_level FROM profiles WHERE id = v_loser_id;
      SELECT total_losses, experience_points INTO v_loser_new_losses, v_loser_exp FROM profiles WHERE id = v_loser_id;
      
      -- Auto level-up: beginner beating intermediate
      IF v_winner_level = 'beginner' AND v_loser_level = 'intermediate' THEN
        -- Count wins against intermediate players
        SELECT COUNT(*) INTO v_wins_against_intermediate
        FROM matches m
        JOIN profiles p ON p.id = CASE WHEN m.player1 = p_winner THEN m.player2 ELSE m.player1 END
        WHERE m.winner = p_winner
          AND m.mode = 'tournament'
          AND m.player1_confirmed = true
          AND m.player2_confirmed = true
          AND p.level = 'intermediate';
        
        IF v_wins_against_intermediate >= 5 THEN
          UPDATE profiles SET level = 'intermediate' WHERE id = p_winner;
          
          INSERT INTO notifications (user_id, type, title, message)
          VALUES (p_winner, 'level_up', 'Level Up! 🎉', 'Congratulations! You''ve been promoted to Intermediate level after winning 5 tournament matches against intermediate players!');
        END IF;
      END IF;
      
      -- Auto level-down: intermediate with 15+ losses
      IF v_loser_level = 'intermediate' AND v_loser_new_losses > 15 THEN
        UPDATE profiles SET 
          level = 'beginner',
          experience_points = FLOOR(v_loser_exp * 0.5)
        WHERE id = v_loser_id;
        
        INSERT INTO notifications (user_id, type, title, message)
        VALUES (v_loser_id, 'level_down', 'Level Demotion', 'You''ve been demoted to Beginner level after accumulating more than 15 tournament losses. Your experience has been reset to 50%.');
      END IF;
    END;
  END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.update_match_stats TO authenticated;