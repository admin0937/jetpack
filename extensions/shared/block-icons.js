/**
 * Internal dependencies
 */
import { isAtomicSite, isSimpleSite } from './site-type-utils';

/**
 * Returns the icon color for Jetpack blocks.
 *
 * Green in the Jetpack context, otherwise black for Simple sites or Atomic sites.
 *
 * @return {string} HEX color for block editor icons
 */
export function getIconColor() {
	if ( isAtomicSite() || isSimpleSite() ) {
		// Default Gutenberg G2 Black
		// https://github.com/WordPress/gutenberg/blob/34ed2a6042d42fa18a5dcd0853d59bdff6a068d9/packages/base-styles/_colors.scss#L29
		return '#1e1e1e';
	}

	// Jetpack Green
	// https://github.com/Automattic/jetpack/blob/ed275e2d8167f79899c4965719f76410e244be87/_inc/client/scss/variables/_colors.scss#L95
	return '#00be28';
}
