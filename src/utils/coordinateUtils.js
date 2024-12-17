const mapResolution = 0.05; // 미터 당 픽셀 (meters per pixel)
const mapOrigin = [-10.0, -10.0]; // 맵의 원점 좌표 (x, y)

/**
 * 월드 좌표 (미터)를 화면(맵) 좌표 (픽셀)로 변환
 * @param {number} worldX - 월드 좌표 X
 * @param {number} worldY - 월드 좌표 Y
 * @param {number} imageNaturalWidth - 자연 크기의 맵 너비 (픽셀)
 * @param {number} imageNaturalHeight - 자연 크기의 맵 높이 (픽셀)
 * @returns {object} - 화면 좌표 {x, y}
 */
export const worldToMap = (worldX, worldY, imageNaturalWidth, imageNaturalHeight) => {
  const mapX = (worldX - mapOrigin[0]) / mapResolution;
  const mapY = imageNaturalHeight - (worldY - mapOrigin[1]) / mapResolution; // Y 좌표 반전

  return { x: mapX, y: mapY };
};

/**
 * 화면(맵) 좌표 (픽셀)를 월드 좌표 (미터)로 변환
 * @param {number} mapX - 화면 좌표 X
 * @param {number} mapY - 화면 좌표 Y
 * @param {number} imageNaturalWidth - 자연 크기의 맵 너비 (픽셀)
 * @param {number} imageNaturalHeight - 자연 크기의 맵 높이 (픽셀)
 * @returns {object} - 월드 좌표 {x, y}
 */
export const mapToWorld = (mapX, mapY, imageNaturalWidth, imageNaturalHeight) => {
  const worldX = mapX * mapResolution + mapOrigin[0];
  const worldY = (imageNaturalHeight - mapY) * mapResolution + mapOrigin[1];

  return { x: worldX, y: worldY };
};
