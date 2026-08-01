import { Easing, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fontFamily } from "./font";
import { RocketMark } from "./RocketMark";

/**
 * The lower-third caption band shared by every feature scene.
 * It sits below the screenshot window so it never covers app UI.
 */
export const SceneCaption: React.FC<{
  index: string;
  title: string;
  subtitle: string;
}> = ({ index, title, subtitle }) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Caption band"
      style={{
        position: "absolute",
        left: 0,
        bottom: 0,
        width: 1920,
        height: 300,
        background: "linear-gradient(100deg, #0A0B18 0%, #14153A 100%)",
        borderTop: "2px solid #4F46E5",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        paddingLeft: 120,
        paddingRight: 120,
        fontFamily,
        translate: interpolate(frame, [0, 20], ["0px 300px", "0px 0px"], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: 1300,
        }}
      >
        <Interactive.Div
          name="Step index"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 4,
            color: "#818CF8",
            opacity: interpolate(frame, [6, 22], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          <span style={{ width: 44, height: 3, backgroundColor: "#4F46E5" }} />
          {index}
        </Interactive.Div>
        <Interactive.Div
          name="Scene title"
          style={{
            fontSize: 74,
            fontWeight: 800,
            lineHeight: 1.1,
            color: "#F8FAFC",
            letterSpacing: -1.5,
            opacity: interpolate(frame, [8, 26], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [8, 30], ["-40px 0px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {title}
        </Interactive.Div>
        <Interactive.Div
          name="Scene subtitle"
          style={{
            fontSize: 36,
            fontWeight: 400,
            lineHeight: 1.3,
            color: "#9AA3B8",
            opacity: interpolate(frame, [16, 36], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
            translate: interpolate(frame, [16, 40], ["-24px 0px", "0px 0px"], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: Easing.bezier(0.16, 1, 0.3, 1),
            }),
          }}
        >
          {subtitle}
        </Interactive.Div>
      </div>
      <Interactive.Div
        name="Wordmark"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          fontSize: 34,
          fontWeight: 700,
          color: "#E2E8F0",
          opacity: interpolate(frame, [20, 40], [0, 0.85], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          }),
        }}
      >
        <RocketMark size={38} color="#818CF8" />
        SpecPilot
      </Interactive.Div>
    </Interactive.Div>
  );
};
