nwHACKS

We have the hand. First we need to detect the hand. Then add a cartesian system to see if the hand is moving front or back. Based on threshold, we can tell slow, medium fast etc.

We need to calculate the speed of the hand at each time with delta space / delta time with time in 50 ms. This will give us the speed at every instance and then classify them as: what direction they are going and how fast they are going.

For the text to show, we can use GPT

- Use a model to detect the hand DONE
- Use a model to detect the face done
- Render the two items, one for each user. done
- Use socket to send the hand and things over the network of two players playing DONE
- Detect collision between the face and hand
- Render the video, with the webcam, the current person face (socket) and the other player hand (socket) done
- Detect the speed of the hand: math involved to find
- Formula for calculating the scoring for the smash: the user slaps, and the collision detects the final velocity and translate that velocity to the score.
- Render the health score on the bottom of the screen
- (Optional) when there is other person turn, make their screen bigger

- Live stream the video with the Aquareum.tv
- Make blockchain smart contract for health score calculation and payment management (security)
