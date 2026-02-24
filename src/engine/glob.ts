export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function segmentMatch(pathSegment: string, patternSegment: string): boolean {
  const regex = new RegExp(`^${escapeRegex(patternSegment).replace(/\\\*/g, "[^/]*")}$`);
  return regex.test(pathSegment);
}

export function globLikeMatch(filePath: string, pattern: string): boolean {
  const normalizedPath = filePath.replaceAll("\\", "/");
  const normalizedPattern = pattern.replaceAll("\\", "/");

  const pathSegments = normalizedPath.split("/").filter(Boolean);
  const patternSegments = normalizedPattern.split("/").filter(Boolean);

  const matchFrom = (pathIndex: number, patternIndex: number): boolean => {
    if (patternIndex >= patternSegments.length) {
      return pathIndex >= pathSegments.length;
    }

    const currentPattern = patternSegments[patternIndex];

    if (currentPattern === "**") {
      if (patternIndex === patternSegments.length - 1) {
        return true;
      }

      for (let nextPathIndex = pathIndex; nextPathIndex <= pathSegments.length; nextPathIndex += 1) {
        if (matchFrom(nextPathIndex, patternIndex + 1)) {
          return true;
        }
      }

      return false;
    }

    if (pathIndex >= pathSegments.length) {
      return false;
    }

    if (!segmentMatch(pathSegments[pathIndex], currentPattern)) {
      return false;
    }

    return matchFrom(pathIndex + 1, patternIndex + 1);
  };

  return matchFrom(0, 0);
}
