/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withDispatch } from '@wordpress/data';
import { Button, MenuItem, MenuGroup, Dropdown, NavigableMenu } from '@wordpress/components';

/**
 * Internal dependencies
 */
import MediaSources from './media-sources';

function MediaButtonMenu( props ) {
	const { mediaProps, openModal, open, setSelectedSource, isFeatured, isReplace } = props;
	const originalComponent = mediaProps.render;

	if ( isReplace ) {
		return (
			<MediaSources
				originalButton={ originalComponent }
				open={ open }
				setSource={ setSelectedSource }
			/>
		);
	}

	const dropdownOpen = onToggle => {
		onToggle();
		open();
	};
	const changeSource = ( source, onToggle ) => {
		setSelectedSource( source );
		onToggle();
		// openModal('edit-post/options');
		// openModal('edit-post/keyboard-shortcut-help');
		openModal( 'edit-post/external-media' );
	};
	const openLibrary = onToggle => {
		onToggle();
		open();
	};

	if ( isFeatured && mediaProps.value === undefined ) {
		return originalComponent( { open } );
	}

	return (
		<>
			{ isFeatured && originalComponent( { open } ) }

			<Dropdown
				position="bottom right"
				renderToggle={ ( { isOpen, onToggle } ) => (
					<Button
						isTertiary={ ! isFeatured }
						isPrimary={ isFeatured }
						className="jetpack-external-media-browse-button"
						aria-haspopup="true"
						aria-expanded={ isOpen }
						onClick={ onToggle }
					>
						{ __( 'Select Image', 'jetpack' ) }
					</Button>
				) }
				renderContent={ ( { onToggle } ) => (
					<NavigableMenu aria-label={ __( 'Select Image', 'jetpack' ) }>
						<MenuGroup>
							<MenuItem icon="admin-media" onClick={ () => openLibrary( onToggle ) }>
								{ __( 'Media Library', 'jetpack' ) }
							</MenuItem>

							<MediaSources
								open={ () => dropdownOpen( onToggle ) }
								setSource={ source => changeSource( source, onToggle ) }
							/>
						</MenuGroup>
					</NavigableMenu>
				) }
			/>
		</>
	);
}

export default withDispatch( dispatch => ( {
	openModal: dispatch( 'core/edit-post' ).openModal,
} ) )( MediaButtonMenu );
