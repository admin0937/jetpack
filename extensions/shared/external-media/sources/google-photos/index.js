/**
 * Internal dependencies
 */
import GooglePhotosAuth from './google-photos-auth';
import GooglePhotosMedia from './google-photos-media';

function GooglePhotos( props ) {
	if ( props.requiresAuth ) {
		return <GooglePhotosAuth { ...props } />;
	}

	return <GooglePhotosMedia { ...props } />;
}

export default GooglePhotos;
