nwHACKS

We have the hand. First we need to detect the hand. Then add a cartesian system to see if the hand is moving front or back. Based on threshold, we can tell slow, medium fast etc.

We need to calculate the speed of the hand at each time with delta space / delta time with time in 50 ms. This will give us the speed at every instance and then classify them as: what direction they are going and how fast they are going.

For the text to show, we can use GPT

- Use a model to detect the hand DONE
- Use a model to detect the face DONE
- Render the two items, one for each user. DONE
- Use socket to send the hand and things over the network of two players DONE
- Detect collision between the face and hand
- Render the video, with the webcam, the current person face (socket) and the other player hand (socket) DONE
- Detect the speed of the hand: math involved to find
- Formula for calculating the scoring for the smash: the user slaps, and the collision detects the final velocity and translate that velocity to the score.
- Render the health score on the bottom of the screen
- (Optional) when there is other person turn, make their screen bigger

- Live stream the video with the Aquareum.tv
- Make blockchain smart contract for health score calculation and payment management (security)



# Technologies Used
- MediaPipe: Used for detecting facial landmarks and hand skeletons to construct real-time models for further analysis. Provided by Google, this framework was instrumental in building the foundation for facial and hand tracking.

- Next.js: Integrated the frontend with the smart contracts and machine learning models for facial detection. Centralized all application logic, enabling seamless interaction between users and backend systems.

- WebRTC (Peer-to-Peer Connection): Implemented from scratch to enable live video calls between users. Ensured minimal latency during gameplay while overlaying skeleton models on top of users' faces.

- Express.js and Socket.IO: Facilitated synchronization of keypoints and shared data across players. Enabled real-time communication for a smooth multiplayer experience.

- Render.com: Used for deploying the backend server to ensure reliable and scalable performance.

- Vercel: Deployed the frontend application, ensuring fast and consistent delivery of the user interface.

- Solidity and Hardhat: Developed smart contracts, including BidFactory and Bid, to handle bidding logic securely. Utilized Chai and Mocha for rigorous testing of smart contracts. Implemented an RPC protocol to connect the smart contracts with the frontend seamlessly.

- Stream.place: Enabled live streaming of the game directly on the website. Provided players and spectators with a seamless and interactive viewing experience.
