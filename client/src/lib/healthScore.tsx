import HealthScoreBlue0 from "../../public/assets/health-blue/0.svg";
import HealthScoreBlue1 from "../../public/assets/health-blue/1.svg";
import HealthScoreBlue2 from "../../public/assets/health-blue/2.svg";
import HealthScoreBlue3 from "../../public/assets/health-blue/3.svg";
import HealthScoreBlue4 from "../../public/assets/health-blue/4.svg";
import HealthScoreBlue5 from "../../public/assets/health-blue/5.svg";
import HealthScoreBlue6 from "../../public/assets/health-blue/6.svg";
import HealthScoreBlue7 from "../../public/assets/health-blue/7.svg";
import HealthScoreBlue8 from "../../public/assets/health-blue/8.svg";
import HealthScoreBlue9 from "../../public/assets/health-blue/9.svg";
import HealthScoreBlue10 from "../../public/assets/health-blue/10.svg";

import HealthScoreRed0 from "../../public/assets/health-red/0.svg";
import HealthScoreRed1 from "../../public/assets/health-red/1.svg";
import HealthScoreRed2 from "../../public/assets/health-red/2.svg";
import HealthScoreRed3 from "../../public/assets/health-red/3.svg";
import HealthScoreRed4 from "../../public/assets/health-red/4.svg";
import HealthScoreRed5 from "../../public/assets/health-red/5.svg";
import HealthScoreRed6 from "../../public/assets/health-red/6.svg";
import HealthScoreRed7 from "../../public/assets/health-red/7.svg";
import HealthScoreRed8 from "../../public/assets/health-red/8.svg";
import HealthScoreRed9 from "../../public/assets/health-red/9.svg";
import HealthScoreRed10 from "../../public/assets/health-red/10.svg";

export const HealthScoreBlue = {
	0: HealthScoreBlue0,
	1: HealthScoreBlue1,
	2: HealthScoreBlue2,
	3: HealthScoreBlue3,
	4: HealthScoreBlue4,
	5: HealthScoreBlue5,
	6: HealthScoreBlue6,
	7: HealthScoreBlue7,
	8: HealthScoreBlue8,
	9: HealthScoreBlue9,
	10: HealthScoreBlue10,
};

export const HealthScoreRed = {
	0: HealthScoreRed0,
	1: HealthScoreRed1,
	2: HealthScoreRed2,
	3: HealthScoreRed3,
	4: HealthScoreRed4,
	5: HealthScoreRed5,
	6: HealthScoreRed6,
	7: HealthScoreRed7,
	8: HealthScoreRed8,
	9: HealthScoreRed9,
	10: HealthScoreRed10,
};

export type HealthScore = typeof HealthScoreBlue | typeof HealthScoreRed;

// react component for rendering as svg
export function HealthScoreIcon({
	score,
	color,
}: {
	score: keyof typeof HealthScoreBlue;
	color: "blue" | "red";
}) {
	const HealthScore = color === "blue" ? HealthScoreBlue : HealthScoreRed;
	const Component = HealthScore[score];
	return <Component />;
}
